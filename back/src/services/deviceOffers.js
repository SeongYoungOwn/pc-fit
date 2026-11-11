

const supported = new Set(['Smartphones', 'Laptops', 'Tablets', 'Smartwatches']);
const clean = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();

function safeLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

async function naverOffers(query) {
  return { provider: 'naver', status: 'retired', items: [],
    searchUrl: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(query),
    notice: '네이버 쇼핑 검색 API는 2026-07-31 종료되었습니다. 쇼핑 인사이트는 가격을 제공하지 않습니다.' };
}

async function danawaOffers(query) {
  const { searchDanawa } = await import('danawa-cli');
  const result = await searchDanawa({ query, page: 1, limit: 10, signal: AbortSignal.timeout(15000) });
  if (!result.ok) throw new Error('Danawa search failed');
  return { provider: 'danawa', status: 'available', items: result.items.map(item => ({
    id: String(item.productCode), name: clean(item.productName), price: Number(item.minPrice),
    seller: '다나와 가격비교',
    url: /^\d+$/.test(String(item.productCode)) ? `https://prod.danawa.com/info/?pcode=${item.productCode}` : null
  })) };
}

async function getDeviceOffers(product) {
  if (!supported.has(product.category)) {
    return { providers: [], notice: '스마트폰·노트북·태블릿·스마트워치에서 제공됩니다.' };
  }
  const query = clean(product.version || product.model || product.name).slice(0, 100);
  const providers = await Promise.all([
    naverOffers(query).catch(() => ({ provider: 'naver', status: 'unavailable', items: [] })),
    danawaOffers(query).catch(() => ({ provider: 'danawa', status: 'unavailable', items: [] }))
  ]);
  for (const provider of providers) {
    provider.items = provider.items.filter(item => item.url && Number.isFinite(item.price) && item.price > 0)
      .filter(item => !/케이스|필름|스트랩|보호커버|충전기|중고|렌탈|리퍼|가개통|해외|직구|글로벌|병행수입/.test(item.name))
      .sort((a, b) => a.price - b.price);
  }
  return { query, checkedAt: new Date().toISOString(), providers,
    notice: '모델 검색 결과입니다. 용량·구성·통신사 가입 조건 및 배송비를 판매 페이지에서 확인하세요.' };
}

module.exports = { getDeviceOffers };
