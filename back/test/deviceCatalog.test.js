// Synthetic product fixtures. No real provider calls, credentials, or licensed data in this file.
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { parseFilters, getDateWindow, isInScope, domesticReview } = require('../src/services/deviceCatalogPolicy');
const { normalizeProduct, readSearchResponse, readDetailResponse, dateRange } = require('../src/services/techSpecsNormalizer');
const { createTechSpecsClient } = require('../src/services/techSpecsClient');
const { createDeviceCatalogService } = require('../src/services/deviceCatalogService');
const { createSQLiteCatalogRepository, createDeviceCatalogRepository } = require('../src/services/deviceCatalogRepository');
const { createDeviceRouter } = require('../src/routes/deviceRoutes');
const now = () => new Date('2026-11-07T12:00:00Z');
const config = () => ({ apiId: 'fixture-id', apiKey: 'fixture-secret', storageAllowed: true });
function raw(id = 'fixture-1', brand = 'Samsung', category = 'Smartphones', date = '2024-01-24') {
  return { Product: { id, Brand: brand, Category: category, Model: `${brand} fixture device`, Version: 'fixture-version' },
    'Release Date': date, Inside: { RAM: { Capacity: '8 GB' } } };
}
const envelope = items => ({ status: 'success', total_pages: 2, page: 0, data: items });
function harness(t, items = [raw()]) {
  const repository = createSQLiteCatalogRepository(':memory:');
  t.after(() => repository.close());
  let providerCalls = 0;
  const client = {
    async search() { providerCalls++; return envelope(items); },
    async detail(id) { providerCalls++; return { status: 'success', data: items.find(p => p.Product.id === id) }; }
  };
  return { repository, client, calls: () => providerCalls,
    service: createDeviceCatalogService({ client, repository, config, now }) };
}

test('automatic rolling window uses Seoul date and clamps leap days', () => {
  assert.deepEqual(getDateWindow(4, now()), { from: '2022-11-07', to: '2026-11-07' });
  assert.equal(getDateWindow(3, new Date('2024-02-29T00:00:00Z')).from, '2021-02-28');
  assert.equal(getDateWindow(4, new Date('2026-11-06T16:00:00Z')).to, '2026-11-07');
});
test('device categories always use five years; visitors cannot widen it with date/source parameters', () => {
  for (const category of ['Smartphones', 'Tablets', 'Smartwatches', 'Laptops']) {
    const filters = parseFilters({ category, years: 100, from: '1970-01-01', source: 'live' }, now());
    assert.equal(filters.from, '2021-11-07');
    assert.equal(filters.recentYears, 5);
  }
  assert.equal(parseFilters({}, now()).domesticOnly, true);
});
test('desktops/displays/GPUs have no lower date limit or Apple/Samsung restriction', () => {
  for (const category of ['Desktops', 'Displays', 'GPUs']) {
    const f = parseFilters({ category, brand: 'ASUS' }, now());
    assert.equal(f.from, null); assert.equal(f.brand, 'ASUS');
    assert.equal(isInScope(normalizeProduct(raw('old', 'ASUS', category, '2016-01-01')), f), true);
  }
});
test('filters reject malformed or unsupported inputs and the provider minimum page size is ten', () => {
  for (const input of [{ category: 'Cameras' }, { brand: ['Samsung'] }, { query: {} }, { size: 1 }, { size: 200 }, { page: -1 }]) {
    assert.throws(() => parseFilters(input, now()), error => error.status === 400);
  }
});
test('actual v5 array envelope and legacy documented envelope both parse, unknown envelopes fail visibly', () => {
  assert.equal(readSearchResponse(envelope([raw()])).results.length, 1);
  assert.equal(readSearchResponse({ data: { results: [raw()], meta: { page: { total_pages: 1 } } } }).totalPages, 1);
  assert.throws(() => readSearchResponse({ data: { unknown: [] } }), { code: 'TECHSPECS_RESPONSE' });
});
test('actual detail shape uses top-level _id and Key Aspects release date', () => {
  const detail = raw(); delete detail.Product.id; delete detail['Release Date'];
  detail._id = 'fixture-detail'; detail['Key Aspects'] = { 'Release Date': '2024-01-24' };
  const p = readDetailResponse({ status: 'success', data: detail });
  assert.equal(p.id, 'fixture-detail'); assert.equal(p.releaseStart, '2024-01-24');
  assert.equal(p.specs.Inside.RAM.Capacity, '8 GB'); assert.equal(p.availability, 'unverified');
});
test('invalid dates are rejected; partial date precision is retained', () => {
  assert.equal(dateRange('2023-02-30'), null);
  assert.equal(dateRange('2024-02').end, '2024-02-29');
  assert.equal(dateRange('2023').precision, 'year');
});
test('all brand smartphone imports start unverified, never implying domestic availability', async t => {
  const { service, repository } = harness(t);
  await service.importPage({});
  assert.equal((await repository.detail('fixture-1')).availability, 'unverified');
  assert.equal((await service.search({})).total, 0);
  await assert.rejects(service.detail('fixture-1'), { code: 'DEVICE_OUT_OF_SCOPE' });
});
test('review evidence is mandatory, and only verified domestic smartphones enter public results', async t => {
  const { service } = harness(t);
  await service.importPage({});
  await assert.rejects(service.reviewDomestic('fixture-1', { status: 'verified' }), { code: 'INVALID_REVIEW' });
  await service.reviewDomestic('fixture-1', { status: 'verified', sourceUrl: 'https://example.com/official-model' });
  assert.equal((await service.search({})).total, 1);
  assert.equal((await service.detail('fixture-1')).availability, 'verified');
  await service.reviewDomestic('fixture-1', { status: 'not_sold' });
  assert.equal((await service.search({})).total, 0);
});
test('public search and detail always use the DB, including when a visitor asks for live source', async t => {
  const { service, repository, calls } = harness(t);
  await repository.upsert(normalizeProduct(raw('laptop', 'ASUS', 'Laptops', '2024-01-01')));
  await service.reviewDomestic('laptop', {status:'verified',sourceUrl:'https://example.com/kr/laptop'});
  assert.equal((await service.search({ category: 'Laptops', source: 'live' })).items[0].brand, 'ASUS');
  await service.detail('laptop', { category: 'Laptops', source: 'live' });
  assert.equal(calls(), 0);
});
test('DB brand filters come from admitted products and include multiple vendors', async t => {
  const { service, repository } = harness(t);
  for (const brand of ['ASUS', 'LG', 'Dell']) await repository.upsert(normalizeProduct(raw(brand, brand, 'Displays', '2020-01-01')));
  assert.deepEqual((await service.meta({ category: 'Displays' })).brands, ['ASUS', 'Dell', 'LG']);
  assert.equal((await service.search({ category: 'Displays', brand: 'ASUS' })).total, 1);
});
test('SQL search treats user percent/underscore as literal text and does not execute SQL input', async t => {
  const { service, repository } = harness(t);
  await repository.upsert(normalizeProduct(raw('display', 'ASUS', 'Displays')));
  assert.equal((await service.search({ category: 'Displays', query: '%' })).total, 0);
  assert.equal((await service.search({ category: 'Displays', query: "' OR 1=1 --" })).total, 0);
});
test('upsert is idempotent, preserves domestic review, and keeps versions with different IDs', async t => {
  const { service, repository } = harness(t, [raw('one'), raw('two')]);
  await service.importPage({});
  await service.reviewDomestic('one', { status: 'verified', sourceUrl: 'https://example.com/model' });
  await service.importPage({});
  assert.equal((await repository.detail('one')).availability, 'verified');
  assert.equal((await service.search({})).total, 1);
  assert.equal((await repository.detail('two')).id, 'two');
});
test('mobile filters keep provider pagination even when all rows are too old', async t => {
  const { service } = harness(t, [raw('old', 'Samsung', 'Tablets', '2019-01-01')]);
  const preview = await service.previewImport({ category: 'Tablets' });
  assert.equal(preview.items.length, 0); assert.equal(preview.hasMore, true); assert.equal(preview.skipped, 1);
});
test('imports stop immediately on upstream quota failures and report partial progress', async t => {
  const { repository } = harness(t);
  const service = createDeviceCatalogService({ config, repository, now, client: {
    async search() { return envelope([raw('one'), raw('two')]); },
    async detail(id) { if (id === 'two') throw Object.assign(new Error('quota'), { status: 429, code: 'TECHSPECS_RATE_LIMIT' }); return { data: raw(id) }; }
  } });
  await assert.rejects(service.importPage({}), error => error.progress.imported === 1);
});
test('disabled storage blocks imports and reads; missing DB returns a controlled error', async () => {
  const service = createDeviceCatalogService({ config: () => ({ storageAllowed: false }) });
  await assert.rejects(service.search({}), { code: 'TECHSPECS_STORAGE_DISABLED' });
  await assert.rejects(service.importPage({}), { code: 'TECHSPECS_STORAGE_DISABLED' });
  await assert.rejects(createDeviceCatalogRepository(null).list({}), { code: 'CATALOG_DB_NOT_CONFIGURED' });
});
test('client uses v5 headers and all-brand/unrestricted-date requests without credential URL parameters', async () => {
  let captured;
  const client = createTechSpecsClient({ config, transport: { async get(url, options) { captured = { url, options }; return { data: envelope([]) }; } } });
  await client.search(parseFilters({ category: 'GPUs', size: 10 }, now()));
  assert.equal(captured.options.headers['x-api-key'], 'fixture-secret');
  assert.equal(captured.options.params.brand, undefined); assert.equal(captured.options.params.from, undefined);
  assert.equal(captured.options.params.to, '2026-11-07'); assert.ok(!captured.url.includes('fixture-secret'));
});
test('client does not leak upstream Axios config and handles missing keys', async () => {
  const client = createTechSpecsClient({ config, transport: { async get() { throw Object.assign(new Error('fixture-secret'), { response: { status: 401 }, config: { key: 'fixture-secret' } }); } } });
  await assert.rejects(client.detail('fixture-1'), e => e.code === 'TECHSPECS_AUTH' && !e.stack.includes('fixture-secret'));
  await assert.rejects(createTechSpecsClient({ config: () => ({}) }).detail('fixture-1'), { code: 'TECHSPECS_NOT_CONFIGURED' });
});
test('HTTP catalog exposes DB data only and import/review require admin authentication', async t => {
  const { service, repository, calls } = harness(t);
  await repository.upsert(normalizeProduct(raw('display', 'ASUS', 'Displays')));
  const app = express(); app.use(express.json()); app.use('/devices', createDeviceRouter({ service }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/devices`;
  const meta = await fetch(`${base}/meta?category=Displays`); assert.equal(meta.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await meta.json()).data.brands, ['ASUS']);
  assert.equal((await (await fetch(`${base}/products?category=Displays&source=live`)).json()).data.total, 1);
  assert.equal(calls(), 0);
  assert.equal((await fetch(`${base}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
  assert.equal((await fetch(`${base}/products/display/domestic-availability`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
});

test('comparison accepts two/three distinct same-category products and reads only the DB', async t => {
  const { service, repository, calls } = harness(t);
  for (const [id, brand] of [['tablet-a', 'Apple'], ['tablet-b', 'Samsung'], ['tablet-c', 'Lenovo']]) {
    await repository.upsert(normalizeProduct(raw(id, brand, 'Tablets')));
    await service.reviewDomestic(id,{status:'verified',sourceUrl:'https://example.com/kr/tablet'});
  }
  const compared = await service.compare({ category: 'Tablets', ids: 'tablet-a,tablet-b,tablet-c' });
  assert.equal(compared.products.length, 3); assert.equal(calls(), 0);
  assert.equal(compared.rows.find(row => row.key === 'ram').cells[0].display, '8 GB');
  assert.equal(compared.products[0].specs, undefined);
  assert.equal(compared.score, undefined);
});
test('comparison rejects duplicates, invalid counts, mixed categories, hidden phones and old mobile products', async t => {
  const { service, repository } = harness(t);
  await repository.upsert(normalizeProduct(raw('one', 'Apple', 'Tablets')));
  await repository.upsert(normalizeProduct(raw('phone')));
  await repository.upsert(normalizeProduct(raw('old', 'Apple', 'Tablets', '2018-01-01')));
  for (const ids of ['one', 'one,one', 'one,phone', 'one,old', 'one,a,b,c']) {
    await assert.rejects(service.compare({ category: 'Tablets', ids }));
  }
  await assert.rejects(service.compare({ category: 'Smartphones', ids: 'phone,one' }));
  await assert.rejects(service.compare({ category: 'Cameras', ids: 'one,phone' }), { code: 'INVALID_COMPARISON' });
});
test('numeric comparison never chooses a storage variant or confuses millimeters with screen inches', () => {
  const { numberWithUnit, buildComparison } = require('../src/services/deviceComparison');
  assert.equal(numberWithUnit('172.5 mm, 6.8 inch', 'inch(?:es)?'), 6.8);
  assert.equal(numberWithUnit('8 / 12 GB', 'GB'), null);
  assert.equal(numberWithUnit('256 GB, 512 GB, 1 TB', 'GB'), null);
  const first = normalizeProduct(raw('one', 'Apple', 'Tablets'));
  const second = normalizeProduct(raw('two', 'Samsung', 'Tablets'));
  first.specs.Inside.Battery = { Capacity_mAh: 4000 };
  second.specs.Inside.Battery = { Capacity_mAh: 5000 };
  first.specs.Design = { Body: { Weight_g: 167 } }; second.specs.Design = { Body: { Weight_g: 232 } };
  const comparison = buildComparison([first, second]);
  assert.equal(comparison.rows.find(r => r.key === 'ram').different, false);
  assert.equal(comparison.rows.find(r => r.key === 'battery').different, true);
  assert.ok(comparison.highlights[0].some(h => h.key === 'weight'));
  assert.ok(comparison.highlights[1].some(h => h.key === 'battery'));
  assert.equal(comparison.rows.find(r => r.key === 'camera').cells[0].available, false);
});
test('smartwatch comparison supports missing fields explicitly without manufacturing scores', async t => {
  const { service, repository } = harness(t);
  await repository.upsert(normalizeProduct(raw('watch-one', 'Apple', 'Smartwatches')));
  await repository.upsert(normalizeProduct(raw('watch-two', 'Samsung', 'Smartwatches')));
  for(const id of ['watch-one','watch-two']) await service.reviewDomestic(id,{status:'verified',sourceUrl:'https://example.com/kr/watch'});
  const data = await service.compare({ category: 'Smartwatches', ids: 'watch-one,watch-two' });
  assert.equal(data.rows.find(r => r.key === 'battery').cells[0].display, '공식 자료 미확인');
  assert.equal(data.products[0].category, 'Smartwatches');
});

test('Korean device names and model codes search the real catalog fields', async t => {
  const { service, repository } = harness(t);
  const product = normalizeProduct(raw('korean-phone'));
  product.name = 'Samsung Galaxy S24 Ultra 5G'; product.version = 'SM-S928N';
  await repository.upsert(product);
  await service.reviewDomestic(product.id, { status: 'verified', sourceUrl: 'https://example.com/official-model' });
  assert.equal((await service.search({ query: '갤럭시 S24 울트라' })).total, 1);
  assert.equal((await service.search({ query: '갤럭시S24' })).total, 1);
  assert.equal((await service.search({ query: 'SM-S928N' })).total, 1);
  assert.equal((await service.search({ query: '갤럭시 S25' })).total, 0);
});

test('reviewed manufacturer facts are cited and never overwrite provider JSON', () => {
  const { buildComparison } = require('../src/services/deviceComparison');
  const phone = normalizeProduct(raw('reviewed'));
  phone.version = 'SM-S921N'; phone.specs.Inside.Battery = { 'Charging Power_W': 45 };
  const row = buildComparison([phone, normalizeProduct(raw('other'))]).rows.find(r => r.key === 'charging');
  assert.equal(row.cells[0].display, '25 W');
  assert.equal(row.cells[0].originalDisplay, '45');
  assert.ok(row.cells[0].sourceUrl.startsWith('https://www.samsung.com/'));
  assert.equal(phone.specs.Inside.Battery['Charging Power_W'], 45);
});
