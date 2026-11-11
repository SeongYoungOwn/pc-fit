const { parseFilters, isInScope, catalogError, domesticReview } = require('./deviceCatalogPolicy');
const { CATEGORIES } = require('../config/deviceCatalog');
const { normalizeProduct, readSearchResponse, readDetailResponse } = require('./techSpecsNormalizer');
const { buildComparison } = require('./deviceComparison');

function createDeviceCatalogService({ client, repository, config, now = () => new Date(), publicCatalog = false }) {
  function storageReady() {
    if (!config().storageAllowed) throw catalogError(403, 'TECHSPECS_STORAGE_DISABLED', '제품 데이터 저장 권한 설정을 확인해야 합니다.');
  }
  function idOf(id) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw catalogError(400, 'INVALID_ID', '올바른 제품을 선택해 주세요.');
    return id;
  }
  async function search(input = {}) {
    if (!publicCatalog) storageReady();
    const filters = parseFilters(input, now());
    return { ...await repository.list(filters), policy: { recentYears: filters.recentYears, domesticOnly: filters.domesticOnly }, page: filters.page, size: filters.size };
  }
  async function meta(input = {}) {
    const filters = parseFilters(input, now());
    return { categories: CATEGORIES, brands: publicCatalog || config().storageAllowed ? await repository.brands(filters) : [],
      policy: { recentYears: filters.recentYears, domesticOnly: filters.domesticOnly } };
  }
  async function detail(id, input = {}) {
    idOf(id); if (!publicCatalog) storageReady();
    const product = await repository.detail(id);
    if (!isInScope(product, parseFilters(input, now()), { publicOnly: true })) throw catalogError(404, 'DEVICE_OUT_OF_SCOPE', '현재 제공되는 제품이 아닙니다.');
    return product;
  }
  // Provider calls are exclusively made by the importer, never by public search visitors.
  async function previewImport(input = {}) {
    const filters = parseFilters(input, now());
    const { results, totalPages } = readSearchResponse(await client.search(filters));
    const unique = new Map();
    for (const raw of results) {
      const product = normalizeProduct(raw);
      if (isInScope(product, filters)) unique.set(product.id, product);
    }
    return { items: [...unique.values()], filters, skipped: results.length - unique.size,
      hasMore: totalPages === null ? results.length >= filters.size : filters.page + 1 < totalPages };
  }
  async function importPage(input = {}) {
    storageReady();
    const results = await previewImport(input);
    const report = { imported: 0, skipped: results.skipped, failed: 0, failures: [], hasMore: results.hasMore, filters: results.filters };
    for (const summary of results.items) {
      try {
        idOf(summary.id);
        const product = readDetailResponse(await client.detail(summary.id));
        if (product.id !== summary.id || !isInScope(product, results.filters)) { report.skipped++; continue; }
        await repository.upsert(product);
        report.imported++;
      } catch (error) {
        if ([429, 503, 504].includes(error.status) || error.code === 'TECHSPECS_UNAVAILABLE') { error.progress = report; throw error; }
        report.failed++;
        report.failures.push({ id: summary.id, code: error.code || 'IMPORT_FAILED' });
      }
    }
    return report;
  }
  async function reviewDomestic(id, input) {
    storageReady(); idOf(id);
    const review = domesticReview(input);
    await repository.reviewDomestic(id, review);
    return { id, ...review };
  }
  async function compare(input = {}) {
    if (!['Smartphones', 'Tablets', 'Smartwatches', 'Laptops'].includes(input.category)) throw catalogError(400, 'INVALID_COMPARISON', '스마트폰·태블릿·스마트워치·노트북 중 같은 종류를 선택해 주세요.');
    if (typeof input.ids !== 'string') throw catalogError(400, 'INVALID_COMPARISON', '비교할 제품을 2~3개 선택해 주세요.');
    const ids = input.ids.split(',');
    if (ids.length < 2 || ids.length > 3 || new Set(ids).size !== ids.length) throw catalogError(400, 'INVALID_COMPARISON', '서로 다른 제품을 2~3개 선택해 주세요.');
    const products = await Promise.all(ids.map(id => detail(id, { category: input.category })));
    return buildComparison(products);
  }
  return { search, meta, detail, compare, previewImport, importPage, reviewDomestic };
}
module.exports = { createDeviceCatalogService };
