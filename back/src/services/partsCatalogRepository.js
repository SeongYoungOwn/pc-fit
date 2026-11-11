const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { PART_CATEGORIES, SOURCE_URL, LICENSE_URL } = require('../config/partsCatalog');
const { partTokens, toBuilderPart } = require('./partsCatalogNormalizer');
const { likePattern } = require('./deviceSearch');
const { catalogError } = require('./deviceCatalogPolicy');

function createPartsRepository(filename) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS parts_catalog (
      id TEXT PRIMARY KEY, category TEXT NOT NULL, brand TEXT NOT NULL, name TEXT NOT NULL,
      release_year INTEGER, search_text TEXT NOT NULL, data TEXT NOT NULL, synced_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS parts_category_brand_idx ON parts_catalog(category,brand);
    CREATE TABLE IF NOT EXISTS parts_sync (source TEXT PRIMARY KEY, revision TEXT NOT NULL, synced_at TEXT NOT NULL);`);
  const decode = row => ({ ...JSON.parse(row.data), syncedAt: row.synced_at });
  function filters(input = {}) {
    const category = PART_CATEGORIES.find(c => c.value === (input.category || (input.type ? '' : 'CPUs')) || (input.type && c.partType === input.type));
    if (!category) throw catalogError(400, 'INVALID_CATEGORY', '지원하는 부품 종류를 선택해 주세요.');
    const page = Number(input.page ?? 0), size = Number(input.size ?? 12);
    if (!Number.isInteger(page) || page < 0 || page > 100000 || !Number.isInteger(size) || size < 1 || size > 100) throw catalogError(400, 'INVALID_PAGE', '페이지 범위를 확인해 주세요.');
    if ((input.query != null && typeof input.query !== 'string') || (input.brand != null && typeof input.brand !== 'string')) throw catalogError(400, 'INVALID_FILTER', '검색 조건을 확인해 주세요.');
    const query = (input.query || '').trim(), brand = (input.brand || '').trim();
    if (query.length > 100 || brand.length > 100) throw catalogError(400, 'INVALID_FILTER', '검색어가 너무 깁니다.');
    return { category: category.value, page, size, query, brand };
  }
  function where(f) {
    const clauses = ['category = ?'], values = [f.category];
    if (f.brand) { clauses.push('brand = ?'); values.push(f.brand); }
    for (const token of partTokens(f.query)) { clauses.push("search_text LIKE ? ESCAPE '\\'"); values.push(likePattern(token)); }
    return { sql: clauses.join(' AND '), values };
  }
  return {
    list(input = {}) {
      const f = filters(input), w = where(f);
      const total = db.prepare(`SELECT count(*) AS n FROM parts_catalog WHERE ${w.sql}`).get(...w.values).n;
      const rows = db.prepare(`SELECT data,synced_at FROM parts_catalog WHERE ${w.sql} ORDER BY release_year DESC, name COLLATE NOCASE, id LIMIT ? OFFSET ?`).all(...w.values, f.size, f.page * f.size);
      return { items: rows.map(decode), total, page: f.page, size: f.size, hasMore: (f.page + 1) * f.size < total, policy: {} };
    },
    brands(input = {}) {
      const f = filters(input);
      return db.prepare('SELECT DISTINCT brand FROM parts_catalog WHERE category = ? ORDER BY brand COLLATE NOCASE').all(f.category).map(r => r.brand);
    },
    detail(id) {
      if (typeof id !== 'string' || !/^opendb_[a-f0-9-]{36}$/i.test(id)) throw catalogError(400, 'INVALID_ID', '올바른 부품을 선택해 주세요.');
      const row = db.prepare('SELECT data,synced_at FROM parts_catalog WHERE id = ?').get(id);
      if (!row) throw catalogError(404, 'PART_NOT_FOUND', '부품을 찾을 수 없습니다.');
      return decode(row);
    },
    status() {
      const counts = db.prepare('SELECT category,count(*) AS count FROM parts_catalog GROUP BY category').all();
      const sync = db.prepare("SELECT revision,synced_at FROM parts_sync WHERE source = 'buildcores'").get();
      return { total: counts.reduce((n,r) => n + r.count, 0), categories: counts, revision: sync?.revision,
        syncedAt: sync?.synced_at, source: 'BuildCores OpenDB', sourceUrl: SOURCE_URL, license: 'CC BY-NC-SA 4.0', licenseUrl: LICENSE_URL };
    },
    replaceSnapshot(products, revision) {
      if (!products.length) throw new Error('Empty snapshot refused');
      if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Duplicate product IDs');
      const timestamp = new Date().toISOString();
      const insert = db.prepare('INSERT INTO parts_catalog(id,category,brand,name,release_year,search_text,data,synced_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category=excluded.category,brand=excluded.brand,name=excluded.name,release_year=excluded.release_year,search_text=excluded.search_text,data=excluded.data,synced_at=excluded.synced_at');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec('DELETE FROM parts_catalog');
        for (const p of products) { const { searchText, ...data } = p; insert.run(p.id,p.category,p.brand,p.name,p.releaseDate ? Number(p.releaseDate) : null,searchText,JSON.stringify(data),timestamp); }
        db.prepare("INSERT INTO parts_sync(source,revision,synced_at) VALUES('buildcores',?,?) ON CONFLICT(source) DO UPDATE SET revision=excluded.revision,synced_at=excluded.synced_at").run(revision,timestamp);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    builderList(input = {}) { const result = this.list(input); return { ...result, items: result.items.map(toBuilderPart) }; },
    recommendationParts() {
      const categories = PART_CATEGORIES.filter(c => c.partType && c.partType !== 'fan').map(c => c.value);
      const rows = db.prepare(`SELECT data,synced_at FROM parts_catalog WHERE category IN (${categories.map(() => '?').join(',')}) ORDER BY release_year DESC,name,id`).all(...categories);
      // Board partners often repeat the same GPU chipset hundreds of times. Keep a real
      // representative per chipset so the existing CPU×GPU estimator remains bounded.
      const gpuChipsets = new Set();
      return rows.map(decode).filter(p => {
        if (p.sourceCategory !== 'GPU') return true;
        const key = p.specs.chipset || p.name;
        if (gpuChipsets.has(key)) return false;
        gpuChipsets.add(key); return true;
      }).map(toBuilderPart);
    },
    close() { db.close(); }
  };
}
let instance;
function getPartsRepository() {
  if (!instance) instance = createPartsRepository(process.env.PARTS_CATALOG_PATH || path.join(__dirname, '../../.local/parts-catalog.sqlite'));
  return instance;
}
module.exports = { createPartsRepository, getPartsRepository };
