// Small, explicit provider probes. Credentials never appear in logs or command arguments.
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createTechSpecsClient } = require('../src/services/techSpecsClient');
const { parseFilters } = require('../src/services/deviceCatalogPolicy');
const { readSearchResponse } = require('../src/services/techSpecsNormalizer');
const client = createTechSpecsClient();
async function main() {
  const mode = process.argv[2] || 'search';
  let payload;
  if (mode === 'detail') {
    const id = process.argv[3];
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id || '')) throw new Error('Invalid product ID');
    payload = await client.detail(id);
  } else if (mode === 'search') {
    payload = await client.search(parseFilters({ category: process.argv[3] || 'Smartphones',
      brand: process.argv[4] || '', query: process.argv[5] || '', size: '10' }));
  } else throw new Error('Expected search or detail');
  const directory = require('path').join(__dirname, '../.local');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(require('path').join(directory, `techspecs-${mode}-sample.json`), JSON.stringify(payload, null, 2));
  if (mode === 'search') {
    console.log(JSON.stringify({ status: payload.status, total: payload.total_results,
      products: readSearchResponse(payload).results.map(p => ({ product: p.Product, released: p['Release Date'] })) }, null, 2));
  } else {
    console.log(JSON.stringify({ status: payload.status, dataType: Array.isArray(payload.data) ? 'array' : typeof payload.data,
      sample: Array.isArray(payload.data) ? payload.data[0] : payload.data }, null, 2));
  }
}
main().catch(error => { console.error(JSON.stringify({ code: error.code || 'PROBE_FAILED',
  message: error.status ? error.message : 'Probe failed' })); process.exitCode = 1; });
