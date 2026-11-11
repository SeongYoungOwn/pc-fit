const { CATEGORIES } = require('../config/deviceCatalog');

function catalogError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

function dateString(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDateWindow(years = 4, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
  const fromYear = parts.year - years;
  const day = Math.min(parts.day, new Date(Date.UTC(fromYear, parts.month, 0)).getUTCDate());
  return { from: dateString(fromYear, parts.month, day), to: dateString(parts.year, parts.month, parts.day) };
}

function integer(value, fallback, min, max) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value))) throw catalogError(400, 'INVALID_FILTER', '올바른 숫자 조건을 입력해 주세요.');
  const number = Number(value);
  if (number < min || number > max) throw catalogError(400, 'INVALID_FILTER', '조회 범위를 벗어났습니다.');
  return number;
}

function parseFilters(input = {}, now) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw catalogError(400, 'INVALID_FILTER', '검색 조건을 확인해 주세요.');
  const brand = input.brand === undefined ? '' : input.brand;
  const category = input.category === undefined ? 'Smartphones' : input.category;
  const policy = CATEGORIES.find(c => c.value === category);
  if (typeof brand !== 'string' || brand.length > 80 || /[\x00-\x1f]/.test(brand) || !policy) {
    throw catalogError(400, 'INVALID_FILTER', '지원하지 않는 브랜드 또는 기기 종류입니다.');
  }
  const page = integer(input.page, 0, 0, 1000);
  const size = integer(input.size, 12, 10, 20);
  if (input.query !== undefined && typeof input.query !== 'string') {
    throw catalogError(400, 'INVALID_FILTER', '검색어를 확인해 주세요.');
  }
  const query = (input.query || '').trim();
  if (query.length > 100) throw catalogError(400, 'INVALID_FILTER', '검색어는 100자 이내로 입력해 주세요.');
  const window = getDateWindow(policy.recentYears || 4, now);
  return { brand: brand.trim(), category, page, size, query, recentYears: policy.recentYears || null,
    domesticOnly: Boolean(policy.domesticOnly), from: policy.recentYears ? window.from : null, to: window.to };
}

function isInScope(product, filters, { publicOnly = false } = {}) {
  if (!product || (filters.brand && product.brand.toLowerCase() !== filters.brand.toLowerCase()) || product.category !== filters.category) return false;
  if (filters.from && (!product.releaseStart || !product.releaseEnd || product.releaseStart < filters.from || product.releaseEnd > filters.to)) return false;
  if (!filters.from && product.releaseStart && product.releaseStart > filters.to) return false;
  return !publicOnly || !filters.domesticOnly || (product.availability === 'verified' && Boolean(product.domesticSourceUrl));
}

function domesticReview(input = {}) {
  const status = input.status;
  if (!['unverified', 'verified', 'not_sold'].includes(status)) throw catalogError(400, 'INVALID_REVIEW', '정식 출시 확인 상태를 선택해 주세요.');
  let sourceUrl = null;
  if (input.sourceUrl) {
    try {
      const url = new URL(input.sourceUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2000) throw new Error();
      sourceUrl = url.href;
    } catch { throw catalogError(400, 'INVALID_REVIEW', '확인 근거는 HTTPS 주소로 입력해 주세요.'); }
  }
  if (status === 'verified' && !sourceUrl) throw catalogError(400, 'INVALID_REVIEW', '국내 정식 출시 확인에는 근거 주소가 필요합니다.');
  return { status, sourceUrl, checkedAt: new Date().toISOString() };
}

module.exports = { catalogError, getDateWindow, parseFilters, isInScope, domesticReview };
