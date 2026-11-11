const { catalogError } = require('./deviceCatalogPolicy');

const keyName = key => String(key).replace(/[^a-z0-9]/gi, '').toLowerCase();
function field(object, ...names) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return undefined;
  for (const name of names) {
    const key = Object.keys(object).find(k => keyName(k) === keyName(name));
    if (key !== undefined && object[key] !== null && object[key] !== '') return object[key];
  }
}
function scalar(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : null;
}
function dateRange(value) {
  const text = scalar(value);
  if (!text) return null;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T.*)?)?)?$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2] || 1), day = Number(match[3] || 1);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1970 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const start = date.toISOString().slice(0, 10);
  const end = match[3] ? start : match[2]
    ? new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10) : `${year}-12-31`;
  return { start, end, label: text.split('T')[0], precision: match[3] ? 'day' : match[2] ? 'month' : 'year' };
}

function safeImage(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function findImage(raw) {
  const image = field(raw, 'image', 'images');
  if (typeof image === 'string') return safeImage(image);
  if (Array.isArray(image)) return image.map(i => safeImage(typeof i === 'string' ? i : field(i, 'url'))).find(Boolean) || null;
  return safeImage(field(image, 'front', 'url', 'original')) || null;
}

function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const product = field(raw, 'product') || raw;
  const id = scalar(field(raw, 'id', '_id', 'product_id') || field(product, 'id', '_id', 'product_id'));
  const brandText = scalar(field(product, 'brand', 'manufacturer') || field(raw, 'brand'));
  const brand = brandText && (({ apple: 'Apple', samsung: 'Samsung' })[brandText.toLowerCase()] || brandText);
  const categoryText = scalar(field(product, 'category') || field(raw, 'category'));
  const category = categoryText && ({ smartphones: 'Smartphones', laptops: 'Laptops', tablets: 'Tablets',
    smartwatches: 'Smartwatches', desktops: 'Desktops', gpus: 'GPUs',
    displays: 'Displays', monitors: 'Displays' })[categoryText.toLowerCase()];
  const name = scalar(field(product, 'name', 'model', 'product_name') || field(raw, 'name', 'model'));
  const release = field(raw, 'release_date', 'release', 'date');
  const releaseValue = field(release, 'released', 'release_date', 'date') ||
    field(product, 'release_date', 'released') || field(raw, 'released') ||
    field(field(raw, 'key_aspects'), 'release_date') || (typeof release === 'string' ? release : null);
  const date = dateRange(releaseValue);
  if (!id || !name || !brand || !category) return null;
  return {
    id, brand, category, name, model: scalar(field(product, 'model')),
    version: scalar(field(product, 'version')), region: scalar(field(product, 'region', 'country')),
    releaseDate: date?.label || null, releaseStart: date?.start || null, releaseEnd: date?.end || null,
    releasePrecision: date?.precision || null, imageUrl: findImage(raw),
    source: 'TechSpecs', availability: 'unverified', specs: raw
  };
}

function readSearchResponse(payload) {
  if (payload?.status === 'success' && Array.isArray(payload.data)) {
    const pages = Number(payload.total_pages);
    return { results: payload.data, totalPages: Number.isInteger(pages) && pages >= 0 ? pages : null };
  }
  const data = field(payload, 'data');
  const results = field(data, 'results');
  if (!Array.isArray(results)) throw catalogError(502, 'TECHSPECS_RESPONSE', '제품 응답 형식을 확인할 수 없습니다.');
  const page = field(field(data, 'meta'), 'page') || {};
  const totalPages = Number(field(page, 'total_pages'));
  return { results, totalPages: Number.isInteger(totalPages) && totalPages >= 0 ? totalPages : null };
}
function readDetailResponse(payload) {
  const data = field(payload, 'data');
  const results = field(data, 'results');
  const result = Array.isArray(data) ? data[0] : Array.isArray(results) ? results[0] : data;
  const normalized = normalizeProduct(result);
  if (!normalized) throw catalogError(502, 'TECHSPECS_RESPONSE', '제품 상세 응답 형식을 확인할 수 없습니다.');
  return normalized;
}

module.exports = { field, dateRange, normalizeProduct, readSearchResponse, readDetailResponse };
