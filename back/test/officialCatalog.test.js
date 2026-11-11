const test=require('node:test');
const assert=require('node:assert/strict');
const {createOfficialCatalogRepository}=require('../src/services/officialCatalogRepository');
const {parseFilters}=require('../src/services/deviceCatalogPolicy');
const {createDeviceCatalogService}=require('../src/services/deviceCatalogService');
const now=()=>new Date('2026-11-10T00:00:00Z');
test('four domestic catalogs browse and compare without provider credentials or calls',async()=>{
  const config=()=>({storageAllowed:false});
  const repository=createOfficialCatalogRepository({},config,':memory:');
  const service=createDeviceCatalogService({repository,config,now,publicCatalog:true});
  for(const category of ['Smartphones','Tablets','Smartwatches','Laptops']) {
    const r=await service.search({category,size:10});
    assert.ok(r.total>=2,category);assert.ok(r.items.every(p=>p.availability==='verified'&&p.sourceUrl));
    const result=await service.compare({category,ids:r.items.slice(0,2).map(p=>p.id).join(',')});
    assert.equal(result.products.length,2);
    assert.ok(!result.detailedRows.some(r=>r.key.includes('_provenance')));
  }
  for(const category of ['Laptops','Tablets','Smartwatches']) {
    const brands=await repository.brands(parseFilters({category},now())); assert.ok(brands.length>=2,category);
    for(const brand of brands){const r=await service.search({category,brand});assert.ok(r.total>0);assert.ok(r.items.every(p=>p.brand===brand));}
  }
  assert.equal(parseFilters({category:'Laptops'},now()).from,'2021-11-10');
  const samsung=await service.search({category:'Smartwatches',query:'갤럭시 워치7'});
  assert.equal(samsung.total,2);
  const future=await repository.list(parseFilters({category:'Smartphones'},new Date('2035-01-01')));
  assert.equal(future.total,0);
  const pages=await Promise.all([0,1].map(page=>service.search({category:'Smartphones',page,size:10})));
  assert.equal(new Set(pages.flatMap(r=>r.items.map(p=>p.id))).size,pages.reduce((n,r)=>n+r.items.length,0));
});
