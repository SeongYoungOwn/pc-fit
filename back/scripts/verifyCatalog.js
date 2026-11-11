// Uses localhost and saved SQLite only; no external API calls or paid usage.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { getPartsRepository } = require('../src/services/partsCatalogRepository');
const { PART_CATEGORIES } = require('../src/config/partsCatalog');
async function get(endpoint) {
  const response = await fetch(`http://localhost:8080/api/v1/${endpoint}`);
  const body = await response.json();
  assert.equal(response.status,200,`${endpoint}: ${body.error}`);
  assert.equal(body.success,true); return body.data;
}
async function main() {
  const repo = getPartsRepository();
  try {
    const report = { inventory:repo.status(), categories:[], searches:[] };
    for (const category of PART_CATEGORIES) {
      const result = repo.list({category:category.value});
      assert.ok(result.total>0,category.value); assert.ok(result.items[0].sourceUrl);
      assert.equal(repo.detail(result.items[0].id).id,result.items[0].id);
      report.categories.push({category:category.value,total:result.total});
    }
    for (const category of PART_CATEGORIES.filter(c=>c.partType && c.partType!=='fan')) {
      const result = await get(`search/parts?type=${category.partType}&page=1`);
      assert.ok(result.total>0,category.value); assert.equal(result.items[0].price,null);
      assert.equal(result.items[0].source,'BuildCores OpenDB');
    }
    for (const [category,query] of [['CPUs','라이젠 7800X3D'],['Motherboards','B650'],['Memory','DDR5'],['GPUs','RTX 5070'],['Storage','Samsung']]) {
      const data = await get(`devices/products?category=${category}&query=${encodeURIComponent(query)}`);
      assert.ok(data.total>0,query);
      report.searches.push({category,query,total:data.total,sample:data.items[0].name});
    }
    const first = await get('devices/products?category=CPUs&size=12');
    const second = await get('devices/products?category=CPUs&size=12&page=1');
    assert.equal(new Set([...first.items,...second.items].map(p=>p.id)).size,24);
    const detail = await get(`devices/products/${first.items[0].id}?category=CPUs`);
    assert.ok(detail.specs.cores); assert.ok(detail.licenseUrl);
    const phones = await get('devices/products?category=Smartphones&size=12');
    assert.ok(phones.total>=2);
    const comparison = await get(`devices/compare?category=Smartphones&ids=${phones.items.slice(0,2).map(p=>p.id).join(',')}`);
    assert.equal(comparison.products.length,2);
    report.phoneCount=phones.total; report.comparison='passed'; report.pagination='passed';
    report.checkedAt=new Date().toISOString();
    fs.writeFileSync(path.join(__dirname,'../.local/catalog-verification.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({total:report.inventory.total,categories:report.categories.length,searches:report.searches,phoneCount:report.phoneCount,comparison:report.comparison,pagination:report.pagination},null,2));
  } finally {repo.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
