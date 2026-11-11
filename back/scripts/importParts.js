const fs = require('fs');
const path = require('path');
const { PART_CATEGORIES } = require('../src/config/partsCatalog');
const { normalizePart } = require('../src/services/partsCatalogNormalizer');
const { getPartsRepository } = require('../src/services/partsCatalogRepository');

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../.local/buildcores/source.json'), 'utf8').replace(/^\uFEFF/, ''));
  const productsById = new Map(), errors = [], duplicates = [];
  let sourceRecords = 0;
  const categories = {};
  for (const category of PART_CATEGORIES) {
    const directory = path.join(manifest.sourceRoot, 'open-db', category.sourceCategory);
    if (!fs.existsSync(directory)) throw new Error(`Missing category: ${category.sourceCategory}`);
    const files = fs.readdirSync(directory).filter(f => f.endsWith('.json'));
    categories[category.value] = 0;
    for (const filename of files) {
      try {
        const product = normalizePart(JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8')),category.sourceCategory,manifest.revision,filename);
        sourceRecords++;
        if (productsById.has(product.id)) {
          duplicates.push({ id: product.id, category: category.sourceCategory, filename });
          // Prefer the canonical filename for a duplicate source ID.
          if (filename === `${product.specs.opendb_id}.json`) productsById.set(product.id,product);
        } else productsById.set(product.id,product);
      }
      catch (error) { errors.push({ category: category.sourceCategory, filename, error: error.message }); }
    }
  }
  // An unexpected schema change must not replace a good catalog with an incomplete snapshot.
  if (errors.length) { fs.writeFileSync(path.join(__dirname,'../.local/parts-import-errors.json'),JSON.stringify(errors,null,2)); throw new Error(`${errors.length} invalid source records; snapshot not applied`); }
  const repo = getPartsRepository();
  try {
    const products = [...productsById.values()];
    for (const product of products) categories[product.category]++;
    repo.replaceSnapshot(products,manifest.revision);
    const report = { ...repo.status(), imported: products.length, sourceRecords, duplicateRecords: duplicates, counts: categories, rejected: errors.length };
    fs.writeFileSync(path.join(__dirname,'../.local/parts-import-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { repo.close(); }
}
try { main(); } catch (error) { console.error(error.message); process.exitCode=1; }
