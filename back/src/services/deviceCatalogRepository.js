const { catalogError } = require('./deviceCatalogPolicy');
const { searchTokens, likePattern } = require('./deviceSearch');

const toRow = p => ({ provider: 'techspecs', provider_id: p.id, brand: p.brand, category: p.category,
  name: p.name, model: p.model, version: p.version, region: p.region, release_date: p.releaseDate,
  release_start: p.releaseStart, release_end: p.releaseEnd, release_precision: p.releasePrecision,
  image_url: p.imageUrl, specs: p.specs, synced_at: new Date().toISOString() });
const fromRow = r => ({ id: r.provider_id, brand: r.brand, category: r.category, name: r.name,
  model: r.model, version: r.version, region: r.region, releaseDate: r.release_date,
  releaseStart: r.release_start, releaseEnd: r.release_end, releasePrecision: r.release_precision,
  imageUrl: r.image_url, specs: r.specs || {}, source: 'TechSpecs', availability: r.domestic_availability,
  domesticSourceUrl: r.domestic_source_url, syncedAt: r.synced_at });

function createDeviceCatalogRepository(db) {
  const ready = () => { if (!db) throw catalogError(503, 'CATALOG_DB_NOT_CONFIGURED', '제품 데이터베이스를 연결해야 합니다.'); };
  const check = e => { if (e) throw catalogError(503, 'CATALOG_DB_ERROR', '제품 데이터베이스를 확인해야 합니다.'); };
  function scoped(query, f) {
    query = query.eq('provider', 'techspecs').eq('category', f.category);
    if (f.brand) query = query.eq('brand', f.brand);
    if (f.from) query = query.gte('release_start', f.from).lte('release_end', f.to);
    else query = query.or(`release_start.is.null,release_start.lte.${f.to}`);
    if (f.domesticOnly) query = query.eq('domestic_availability', 'verified').not('domestic_source_url', 'is', null);
    return query;
  }
  return {
    async list(f) {
      ready(); let q = scoped(db.from('device_products').select('*', { count: 'exact' }), f);
      for (const token of searchTokens(f.query)) {
        const pattern = JSON.stringify(likePattern(token));
        q = q.or(`name.ilike.${pattern},version.ilike.${pattern}`);
      }
      const { data, count, error } = await q.order('release_start', { ascending: false, nullsFirst: false })
        .order('provider_id', { ascending: true }).range(f.page * f.size, (f.page + 1) * f.size - 1);
      check(error); return { items: (data || []).map(fromRow), total: count || 0, hasMore: (f.page + 1) * f.size < count };
    },
    async brands(f) {
      ready(); const { data, error } = await db.rpc('device_catalog_brands', { p_category: f.category, p_from: f.from,
        p_to: f.to, p_domestic_only: f.domesticOnly });
      check(error); return (data || []).map(r => r.brand);
    },
    async detail(id) {
      ready(); const { data, error } = await db.from('device_products').select('*').eq('provider', 'techspecs').eq('provider_id', id).maybeSingle();
      check(error); if (!data) throw catalogError(404, 'DEVICE_NOT_FOUND', '제품을 찾을 수 없습니다.'); return fromRow(data);
    },
    async upsert(p) { ready(); const { error } = await db.from('device_products').upsert(toRow(p), { onConflict: 'provider,provider_id' }); check(error); },
    async reviewDomestic(id, review) {
      ready(); const { data, error } = await db.from('device_products').update({ domestic_availability: review.status,
        domestic_source_url: review.sourceUrl, domestic_checked_at: review.checkedAt }).eq('provider', 'techspecs').eq('provider_id', id).select('provider_id');
      check(error); if (!data?.length) throw catalogError(404, 'DEVICE_NOT_FOUND', '제품을 찾을 수 없습니다.');
    }
  };
}

function createSQLiteCatalogRepository(filename) {
  const fs = require('fs'), path = require('path');
  const { DatabaseSync } = require('node:sqlite');
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS device_products (
      provider TEXT NOT NULL DEFAULT 'techspecs', provider_id TEXT NOT NULL,
      brand TEXT NOT NULL, category TEXT NOT NULL, name TEXT NOT NULL, model TEXT, version TEXT, region TEXT,
      release_date TEXT, release_start TEXT, release_end TEXT, release_precision TEXT, image_url TEXT,
      specs TEXT NOT NULL, synced_at TEXT NOT NULL, domestic_availability TEXT NOT NULL DEFAULT 'unverified',
      domestic_source_url TEXT, domestic_checked_at TEXT, PRIMARY KEY(provider, provider_id));
    CREATE INDEX IF NOT EXISTS devices_category_idx ON device_products(category, brand, release_start);`);
  function scope(f) {
    const clauses = ["provider = 'techspecs'", 'category = ?'], values = [f.category];
    if (f.brand) { clauses.push('brand = ?'); values.push(f.brand); }
    if (f.from) { clauses.push('release_start >= ? AND release_end <= ?'); values.push(f.from, f.to); }
    else { clauses.push('(release_start IS NULL OR release_start <= ?)'); values.push(f.to); }
    if (f.domesticOnly) clauses.push("domestic_availability = 'verified' AND domestic_source_url IS NOT NULL");
    for (const token of searchTokens(f.query)) {
      clauses.push("(name LIKE ? ESCAPE '\\' OR coalesce(version,'') LIKE ? ESCAPE '\\')");
      const pattern = likePattern(token); values.push(pattern, pattern);
    }
    return { where: clauses.join(' AND '), values };
  }
  const decode = r => fromRow({ ...r, specs: JSON.parse(r.specs) });
  return {
    async list(f) {
      const { where, values } = scope(f);
      const count = db.prepare(`SELECT count(*) AS n FROM device_products WHERE ${where}`).get(...values).n;
      const rows = db.prepare(`SELECT * FROM device_products WHERE ${where} ORDER BY release_start DESC, provider_id ASC LIMIT ? OFFSET ?`).all(...values, f.size, f.page * f.size);
      return { items: rows.map(decode), total: count, hasMore: (f.page + 1) * f.size < count };
    },
    async brands(f) {
      const { where, values } = scope({ ...f, brand: '', query: '' });
      return db.prepare(`SELECT DISTINCT brand FROM device_products WHERE ${where} ORDER BY brand`).all(...values).map(r => r.brand);
    },
    async detail(id) {
      const row = db.prepare("SELECT * FROM device_products WHERE provider='techspecs' AND provider_id=?").get(id);
      if (!row) throw catalogError(404, 'DEVICE_NOT_FOUND', '제품을 찾을 수 없습니다.'); return decode(row);
    },
    async upsert(p) {
      const row = toRow(p); row.specs = JSON.stringify(row.specs);
      const columns = Object.keys(row);
      const update = columns.filter(c => !['provider', 'provider_id'].includes(c)).map(c => `${c}=excluded.${c}`).join(',');
      db.prepare(`INSERT INTO device_products (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ON CONFLICT(provider,provider_id) DO UPDATE SET ${update}`).run(...Object.values(row).map(v => v ?? null));
    },
    async reviewDomestic(id, r) {
      const result = db.prepare("UPDATE device_products SET domestic_availability=?, domestic_source_url=?, domestic_checked_at=? WHERE provider='techspecs' AND provider_id=?").run(r.status, r.sourceUrl, r.checkedAt, id);
      if (!result.changes) throw catalogError(404, 'DEVICE_NOT_FOUND', '제품을 찾을 수 없습니다.');
    },
    close() { db.close(); }
  };
}

let configuredRepository;
function getConfiguredRepository() {
  if (configuredRepository) return configuredRepository;
  const supabase = require('../config/supabase');
  if (supabase) configuredRepository = createDeviceCatalogRepository(supabase);
  else if (process.env.NODE_ENV !== 'production') configuredRepository = createSQLiteCatalogRepository(require('path').join(__dirname, '../../.local/device-catalog.sqlite'));
  else configuredRepository = createDeviceCatalogRepository(null);
  return configuredRepository;
}
module.exports = { createDeviceCatalogRepository, createSQLiteCatalogRepository, getConfiguredRepository };
