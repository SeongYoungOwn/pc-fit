const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { CATEGORIES, getCatalogConfig } = require('../src/config/deviceCatalog');
const { parseFilters, catalogError } = require('../src/services/deviceCatalogPolicy');
const { createTechSpecsClient } = require('../src/services/techSpecsClient');
const { getConfiguredRepository } = require('../src/services/deviceCatalogRepository');
const { createDeviceCatalogService } = require('../src/services/deviceCatalogService');

async function main() {
  const args = process.argv.slice(2), options = {};
  const valueFlags = ['--brand', '--category', '--query', '--max-pages', '--size', '--start-page'];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--apply' || flag === '--dry-run') options[flag] = true;
    else if (valueFlags.includes(flag) && args[i + 1] && !args[i + 1].startsWith('--')) options[flag] = args[++i];
    else throw catalogError(400, 'INVALID_ARGS', `지원하지 않는 실행 인수: ${flag}`);
  }
  if (options['--apply'] && options['--dry-run']) throw catalogError(400, 'INVALID_ARGS', '--apply와 --dry-run 중 하나만 선택하세요.');
  const settings = getCatalogConfig();
  if (!settings.apiId || !settings.apiKey) throw catalogError(503, 'TECHSPECS_NOT_CONFIGURED', 'back/.env에 TECHSPECS_API_ID와 TECHSPECS_API_KEY를 설정하세요.');
  const maxPages = Number(options['--max-pages'] || 1);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10) throw catalogError(400, 'INVALID_ARGS', '--max-pages는 1~10입니다.');
  const brand = options['--brand'] === 'all' ? '' : options['--brand'] || '';
  const categories = options['--category'] === 'all' ? CATEGORIES.map(c => c.value) : [options['--category'] || 'Smartphones'];
  const filters = categories.map(category => parseFilters({ brand, category, query: options['--query'],
    page: options['--start-page'], size: options['--size'] || '10' }));
  if (filters.some(f => f.page + maxPages > 1001)) throw catalogError(400, 'INVALID_ARGS', '페이지 범위를 초과했습니다.');
  const apply = Boolean(options['--apply']);
  if (apply && !settings.storageAllowed) throw catalogError(403, 'TECHSPECS_STORAGE_DISABLED', '저장 허가 확인 후 TECHSPECS_STORAGE_ALLOWED=true를 설정하세요.');
  // Dry-run does not initialize a DB connection and never writes provider data to disk.
  const repository = apply ? getConfiguredRepository() : null;
  const service = createDeviceCatalogService({ client: createTechSpecsClient(), repository, config: getCatalogConfig });
  for (const filter of filters) {
    console.log(JSON.stringify({ mode: apply ? 'import' : 'dry-run', brand: filter.brand,
      category: filter.category, from: filter.from, to: filter.to, maxPages }));
    for (let offset = 0; offset < maxPages; offset++) {
      const input = { ...filter, page: filter.page + offset };
      const result = apply ? await service.importPage(input) : await service.previewImport(input);
      console.log(JSON.stringify({ page: input.page, matched: result.items?.length,
        imported: result.imported, skipped: result.skipped, failed: result.failed, hasMore: result.hasMore }));
      if (!result.hasMore) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
main().catch(error => {
  console.error(JSON.stringify({ code: error.code || 'SYNC_FAILED',
    error: error.status ? error.message : '가져오기에 실패했습니다.', progress: error.progress }));
  process.exitCode = 1;
});
