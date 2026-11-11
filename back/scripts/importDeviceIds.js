require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getCatalogConfig } = require('../src/config/deviceCatalog');
const { parseFilters, isInScope, catalogError } = require('../src/services/deviceCatalogPolicy');
const { createTechSpecsClient } = require('../src/services/techSpecsClient');
const { readDetailResponse } = require('../src/services/techSpecsNormalizer');
const { getConfiguredRepository } = require('../src/services/deviceCatalogRepository');
async function main() {
  if (!getCatalogConfig().storageAllowed) throw catalogError(403, 'STORAGE_DISABLED', '데이터 저장 권한을 확인해 주세요.');
  const ids = [...new Set(process.argv.slice(2))];
  if (!ids.length || ids.length > 10 || ids.some(id => !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) throw catalogError(400, 'INVALID_IDS', '실제 검색된 제품 ID를 1~10개 지정하세요.');
  const repo = getConfiguredRepository(), client = createTechSpecsClient();
  try {
    for (const id of ids) {
      const product = readDetailResponse(await client.detail(id));
      if (product.id !== id || !isInScope(product, parseFilters({ category: product.category }))) throw catalogError(400, 'OUT_OF_SCOPE', '제품 분류 또는 출시일 조건을 확인해 주세요.');
      await repo.upsert(product);
      console.log(JSON.stringify({ saved: true, id, name: product.name, version: product.version, category: product.category }));
    }
  } finally { repo.close?.(); }
}
main().catch(error => { console.error(JSON.stringify({ code: error.code || 'IMPORT_FAILED', message: error.status ? error.message : '가져오기에 실패했습니다.' })); process.exitCode = 1; });
