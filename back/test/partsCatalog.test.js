const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePart, toBuilderPart } = require('../src/services/partsCatalogNormalizer');
const { createPartsRepository } = require('../src/services/partsCatalogRepository');
const { createCatalogFacade } = require('../src/services/catalogFacade');
const { PART_CATEGORIES } = require('../src/config/partsCatalog');
const revision = 'a'.repeat(40);
function fixture(n = 1, category = 'CPU', name = 'AMD Ryzen 7 7800X3D') {
  return normalizePart({ opendb_id: `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,
    metadata: { name, manufacturer: 'AMD', part_numbers: ['100-TEST'], releaseYear: 2023 },
    socket: 'AM5', cores: { total: 8, threads: 16 }, specifications: { tdp: 120 } },category,revision);
}
function repoFor(t) { const repo = createPartsRepository(':memory:'); t.after(() => repo.close()); return repo; }

test('source facts and attribution survive normalization; prices and photos are never fabricated', () => {
  const product = fixture();
  assert.equal(product.specs.specifications.tdp,120);
  assert.equal(product.price,null); assert.equal(product.imageUrl,null);
  assert.equal(product.availability,'unverified');
  assert.match(product.sourceUrl,new RegExp(revision));
  assert.equal(product.license,'CC BY-NC-SA 4.0');
  const builder = toBuilderPart(product);
  assert.equal(builder.specs.Socket,'AM5'); assert.equal(builder.tdp,120);
  assert.equal(builder.price,null); assert.equal(builder.priceStatus,'unavailable');
});
test('all PC builder categories include real case and fan searches', t => {
  const repo = repoFor(t);
  const products = PART_CATEGORIES.map((c,i) => fixture(i+1,c.sourceCategory,`Fixture ${c.label}`));
  repo.replaceSnapshot(products,revision);
  for (const type of ['cpu','gpu','motherboard','ram','storage','psu','cooler','case','fan']) assert.equal(repo.builderList({type}).total,1);
  assert.throws(() => repo.list({category:'bad'}),{code:'INVALID_CATEGORY'});
});
test('DB search supports Korean model names, every token, brands, escaped LIKE and pagination', t => {
  const repo = repoFor(t);
  repo.replaceSnapshot(Array.from({length:24},(_,i) => fixture(i+1,'CPU',`AMD Ryzen 7 7800X3D model ${i}`)),revision);
  const result = repo.list({category:'CPUs',query:'라이젠 7800X3D',size:10});
  assert.equal(result.total,24); assert.equal(result.hasMore,true);
  const next = repo.list({category:'CPUs',query:'라이젠 7800X3D',size:10,page:1});
  assert.equal(new Set([...result.items,...next.items].map(p=>p.id)).size,20);
  assert.equal(repo.list({query:'%'}).total,0);
  assert.equal(repo.list({query:"' OR 1=1 --"}).total,0);
  assert.equal(repo.list({brand:'Intel'}).total,0);
  assert.throws(() => repo.list({page:-1}),{code:'INVALID_PAGE'});
  const {partTokens}=require('../src/services/partsCatalogNormalizer');
  assert.deepEqual(partTokens('i5-14400F'),['i5','14400f']);
  assert.deepEqual(partTokens('RTX5070'),['rtx','5070']);
});
test('snapshot replacement uses stable IDs, removes stale products and rolls back failed writes', t => {
  const repo = repoFor(t);
  repo.replaceSnapshot([fixture(),fixture(2)],revision);
  repo.replaceSnapshot([fixture()],revision);
  assert.equal(repo.status().total,1);
  assert.throws(() => repo.replaceSnapshot([{...fixture(3),brand:null}],revision));
  assert.equal(repo.detail(fixture().id).name,fixture().name);
  assert.equal(repo.status().total,1);
  assert.throws(() => repo.replaceSnapshot([],revision));
});
test('public PC catalog queries saved DB without invoking TechSpecs and preserves mobile comparison', async t => {
  const repo = repoFor(t); repo.replaceSnapshot([fixture()],revision);
  let calls = 0;
  const devices = { search: async () => { calls++; return {items:[],total:0}; }, meta: async () => ({brands:[],policy:{recentYears:4}}), compare: async () => 'mobile-comparison' };
  const service = createCatalogFacade({devices,parts:repo});
  const result = await service.search({category:'CPUs'});
  assert.equal(result.total,1); assert.equal(calls,0);
  assert.equal(result.items[0].specs,undefined);
  assert.equal((await service.detail(result.items[0].id,{category:'CPUs'})).specs.socket,'AM5');
  assert.equal((await service.meta({category:'CPUs'})).inventory.total,1);
  assert.equal(await service.compare({}),'mobile-comparison');
});
test('RAM and motherboard adapters preserve exact DDR type for compatibility checks', () => {
  const ram = fixture(1,'RAM'); ram.specs.ram_type='DDR5';
  const board = fixture(2,'Motherboard'); board.specs.memory={ram_type:'DDR4'};
  const {checkCompatibility} = require('../src/services/compatibilityEngine');
  const result = checkCompatibility({cpu:toBuilderPart(fixture(3)),ram:toBuilderPart(ram),motherboard:toBuilderPart(board)});
  assert.equal(result.warnings.some(w=>w.type==='ram_mismatch'),true);
});
test('real specification display adds Korean labels and units without exposing internal identifiers', () => {
  const {formatPartSpecs}=require('../src/services/partsCatalogNormalizer');
  const rows=formatPartSpecs(fixture().specs,'CPU');
  assert.ok(rows.some(r=>r.label==='세부 사양 / TDP' && r.value==='120 W'));
  assert.ok(rows.every(r=>!r.label.includes('opendb_id')));
});
test('PC estimator rejects incompatible cooler sockets, unknown heights and cases too small for GPU/board', () => {
  const {caseFitsParts,airCoolerFits}=require('../src/services/physicalPartFit');
  const cpu={specs:{Socket:'LGA 1700'}},board={specs:{form_factor:'Micro ATX'}},gpu={id:'real-gpu',specs:{length:300}};
  const pcCase={specs:{supported_motherboard_form_factors:['mATX'],max_video_card_length:320,max_cpu_cooler_height:160}};
  const cooler={specs:{cpu_sockets:['LGA1700'],height:155,water_cooled:false}};
  assert.equal(caseFitsParts(pcCase,board,gpu),true); assert.equal(airCoolerFits(cooler,cpu,pcCase),true);
  assert.equal(airCoolerFits({...cooler,specs:{...cooler.specs,cpu_sockets:['LGA 4710']}},cpu,pcCase),false);
  assert.equal(airCoolerFits({...cooler,specs:{...cooler.specs,height:0}},cpu,pcCase),false);
  assert.equal(caseFitsParts(pcCase,board,{id:'real-gpu',specs:{length:340}}),false);
});
