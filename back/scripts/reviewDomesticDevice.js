require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getConfiguredRepository } = require('../src/services/deviceCatalogRepository');
const { domesticReview } = require('../src/services/deviceCatalogPolicy');
async function main() {
  const [id, sourceUrl, status = 'verified'] = process.argv.slice(2);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id || '')) throw new Error('Invalid product ID');
  const review = domesticReview({ status, sourceUrl });
  const repo = getConfiguredRepository();
  try { await repo.reviewDomestic(id, review); console.log(JSON.stringify({ id, status, updated: true })); }
  finally { repo.close?.(); }
}
main().catch(error => { console.error(JSON.stringify({ code: error.code || 'REVIEW_FAILED', message: error.status ? error.message : '확인 정보 저장 실패' })); process.exitCode = 1; });
