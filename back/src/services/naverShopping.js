const axios = require('axios');
const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase');

const NAVER_IMAGE_API_URL = 'https://openapi.naver.com/v1/search/image';
const NAVER_SHOPPING_SEARCH_BASE_URL = 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=';

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1시간 캐시

// 네이버 오픈API 초당 호출 제한(10req/s) 방지를 위한 직렬 스로틀 큐
let requestQueue = Promise.resolve();
const MIN_REQUEST_INTERVAL_MS = 125;
let lastRequestTime = 0;

function enqueueNaverRequest(fn) {
  const run = async () => {
    const now = Date.now();
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestTime));
    if (waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    lastRequestTime = Date.now();
    return fn();
  };
  const next = requestQueue.then(run, run);
  requestQueue = next.catch(() => {});
  return next;
}

function cleanName(title) {
  if (!title) return '';
  return String(title)
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * 카테고리별 기본 하드웨어 SVG 썸네일 생성 (Data URI)
 * 이미지 검색 결과가 모델과 일치하지 않거나 API 요청 실패 시 사용
 */
function getDefaultPartImage(partType = 'cpu') {
  const type = String(partType || 'cpu').toLowerCase();
  const labelMap = {
    cpu: { title: 'PROCESSOR', sub: 'CPU', color: '#00f3ff', icon: 'M7 7h10v10H7V7zm-2 2H3v2h2v2H3v2h2v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2V9h2V7h-2V5h-2V3h-2v2h-2V3h-2v2H9V3H7v2H5v2h2v2H5z' },
    gpu: { title: 'GRAPHICS', sub: 'GPU', color: '#bc13fe', icon: 'M2 6h20v11H6v2H4v-2H2V6zm4 2v7h14V8H6zm3 1.5a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z' },
    ram: { title: 'MEMORY', sub: 'RAM', color: '#00e676', icon: 'M2 7h20v8H2V7zm2 2v4h3V9H4zm5 0v4h3V9H9zm5 0v4h3V9h-3zm5 0v4h1V9h-1zM4 16h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z' },
    motherboard: { title: 'MAINBOARD', sub: 'M/B', color: '#00b0ff', icon: 'M4 3h16v18H4V3zm2 2v14h12V5H6zm2 2h5v5H8V7zm7 0h1v8h-1V7zm-7 7h5v2H8v-2z' },
    storage: { title: 'STORAGE', sub: 'NVMe SSD', color: '#ff9100', icon: 'M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h4v4H8v-4zm6 1h2v2h-2v-2z' },
    psu: { title: 'POWER', sub: 'PSU', color: '#ffd600', icon: 'M3 5h18v14H3V5zm2 2v10h14V7H5zm8 1l-4 5h3v3l4-5h-3V8z' },
    cooler: { title: 'COOLING', sub: 'COOLER', color: '#40c4ff', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a3 3 0 012.8 4.1 3 3 0 013.1 4.9 3 3 0 01-4.9 3.1A3 3 0 018.9 14a3 3 0 01-2.8-5A3 3 0 0112 5zm0 5a2 2 0 100 4 2 2 0 000-4z' },
    case: { title: 'CHASSIS', sub: 'PC CASE', color: '#ff4081', icon: 'M6 2h12v20H6V2zm2 2v16h8V4H8zm2 2h4v2h-4V6zm0 4h4v1h-4v-1z' }
  };

  const cfg = labelMap[type] || labelMap.cpu;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0e1a"/>
        <stop offset="100%" stop-color="#141829"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="16" fill="url(#bg)" stroke="${cfg.color}" stroke-opacity="0.4" stroke-width="2"/>
    <g transform="translate(56, 34) scale(2)" fill="${cfg.color}" opacity="0.85">
      <path d="${cfg.icon}"/>
    </g>
    <text x="80" y="116" text-anchor="middle" fill="#ffffff" font-family="monospace, sans-serif" font-size="13" font-weight="bold">${cfg.sub}</text>
    <text x="80" y="134" text-anchor="middle" fill="${cfg.color}" font-family="monospace, sans-serif" font-size="10" opacity="0.8">${cfg.title}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 부품명으로 네이버 가격비교/쇼핑 검색 결과 페이지 URL 생성 (구매 버튼용)
 * - search.shopping.naver.com 직접 링크 시 외부 유입 차단(HTTP 418)이 발생하므로
 *   공식 통합검색 가격비교 진입 URL(search.naver.com)을 사용하여 차단 없이 쇼핑 가격비교/스마트스토어로 연결
 */
function buildShoppingSearchUrl(partName, partType = '') {
  if (!partName) return 'https://shopping.naver.com';
  let cleaned = sanitizeKeyword(partName) || String(partName || '').trim();

  if (isGenericPlaceholderName(cleaned)) {
    const fallbackMap = {
      cooler: 'CPU 공랭 쿨러',
      case: 'PC 미들타워 ATX 케이스',
      cpu: '게이밍 CPU 프로세서',
      gpu: '지포스 그래픽카드',
      ram: 'DDR5 데스크탑 메모리',
      motherboard: '메인보드',
      storage: 'NVMe M.2 SSD',
      psu: '컴퓨터 파워서플라이 정격'
    };
    const key = String(partType || '').toLowerCase();
    cleaned = fallbackMap[key] || (/COOLER/i.test(cleaned) ? 'CPU 공랭 쿨러' : /CASE/i.test(cleaned) ? 'PC 미들타워 ATX 케이스' : cleaned);
  } else {
    // 쉼표 이후 장문 영문 스펙 설명 제거 및 핵심 모델명 5단어 이내 축약
    cleaned = cleaned.split(',')[0].replace(/\s*\/\s*/g, ' ').trim();
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    if (tokens.length > 5) {
      cleaned = tokens.slice(0, 5).join(' ');
    }
  }

  return `${NAVER_SHOPPING_SEARCH_BASE_URL}${encodeURIComponent(`${cleaned} 가격비교`)}`;
}

function sanitizeKeyword(keyword) {
  if (!keyword) return '';
  return String(keyword)
    .replace(/게이밍/g, '')
    .replace(/그래픽 카드/g, '')
    .replace(/프로세서/g, '')
    .replace(/메인보드/g, '')
    .replace(/데스크톱/g, '')
    .replace(/노트북/g, '')
    .replace(/솔리드 스테이트 드라이브/g, '')
    .replace(/메모리 모듈/g, '')
    .replace(/컴퓨터 조립 케이스/g, '')
    .replace(/공랭쿨러/g, '')
    .replace(/수랭쿨러/g, '')
    .replace(/기본쿨러/g, '')
    .replace(/냉각/g, '')
    .replace(/Black\s*\/\s*Gold/gi, '')
    .replace(/Fully Modular/gi, '')
    .replace(/Certified/gi, '')
    .replace(/\(.+?\)/g, '')
    .replace(/\[.+?\]/g, '')
    .replace(/OEM\/트레이/gi, '')
    .replace(/OEM\/Tray/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 일반화/더미 부품명 여부 확인 (예: "CPU Cooler 23", "Standard ATX Case 3")
 */
function isGenericPlaceholderName(name) {
  if (!name) return true;
  const upper = String(name).toUpperCase().trim();
  if (/^(CPU COOLER|STANDARD .* CASE|GENERIC |DUMMY_|내장그래픽|기본 쿨러)/.test(upper)) {
    return true;
  }
  return false;
}

/**
 * 선택한 부품 모델명에서 반드시 일치해야 하는 핵심 모델 토큰 추출
 */
function extractCoreModelTokens(keyword) {
  const upper = String(keyword || '').toUpperCase();
  const tokens = upper
    .split(/[\s\-_/]+/)
    .map(t => t.replace(/[^A-Z0-9+]/g, ''))
    .filter(t => t.length >= 2);

  // 모델 식별성이 높은 숫자 포함 토큰 (예: 5070, 4070, 14900KF, 7800X3D, B650, Z690, 850W, DDR5)
  const modelSpecificTokens = tokens.filter(t =>
    /\d{3,5}/.test(t) ||
    /^(DDR4|DDR5|AM4|AM5|B\d{3}|Z\d{3}|X\d{3}|H\d{3}|A\d{3}|I[3579])$/.test(t)
  );

  return { allTokens: tokens, modelSpecificTokens };
}

/**
 * 이미지 검색 결과 항목이 실제 선택한 부품 모델과 일치하는지 검증
 */
function selectBestMatchingImage(items, rawPartName, searchKeyword) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const targetUpper = `${rawPartName} ${searchKeyword}`.toUpperCase();
  const { allTokens, modelSpecificTokens } = extractCoreModelTokens(searchKeyword);

  // 파생 등급(Ti, SUPER, XT, XTX) 오매칭 방지 플래그
  const targetHasTi = /\bTI\b/.test(targetUpper) || /\d{4}TI\b/.test(targetUpper);
  const targetHasSuper = /\bSUPER\b/.test(targetUpper);
  const targetHasXtx = /\bXTX\b/.test(targetUpper);

  const excludeWords = [
    '인물', '배경화면', '바탕화면', '움짤', '스티커', '케이스갈이', '빈박스',
    '수리', '채굴', '고장', '다이어그램', '로고', '배너'
  ];

  const scoredCandidates = [];

  for (const item of items) {
    const imageUrl = item.thumbnail || item.link;
    if (!imageUrl || !imageUrl.startsWith('http')) continue;

    const titleClean = cleanName(item.title);
    const titleUpper = titleClean.toUpperCase();

    if (excludeWords.some(w => titleUpper.includes(w))) continue;

    // 핵심 모델 번호 토큰이 존재하는데 이미지 제목에 하나도 없다면 다른 제품 이미지이므로 제외
    if (modelSpecificTokens.length > 0) {
      const hasCoreModel = modelSpecificTokens.some(tok => {
        const baseDigits = tok.match(/\d{3,4}/)?.[0];
        return titleUpper.includes(tok) || (baseDigits && titleUpper.includes(baseDigits));
      });
      if (!hasCoreModel) continue;
    }

    let score = 0;
    for (const tok of allTokens) {
      if (titleUpper.includes(tok)) score += 2;
    }
    for (const mTok of modelSpecificTokens) {
      if (titleUpper.includes(mTok)) score += 4;
    }

    // 파생 모델(예: RTX 5070 검색 시 RTX 5070 Ti 이미지) 페널티 부여
    const titleHasTi = /\bTI\b/.test(titleUpper) || /\d{4}TI\b/.test(titleUpper);
    const titleHasSuper = /\bSUPER\b/.test(titleUpper);
    const titleHasXtx = /\bXTX\b/.test(titleUpper);

    if (!targetHasTi && titleHasTi) score -= 5;
    if (!targetHasSuper && titleHasSuper) score -= 4;
    if (!targetHasXtx && titleHasXtx) score -= 4;

    // 정사각형/가로형 상품 썸네일 선호
    const w = parseInt(item.sizewidth, 10) || 0;
    const h = parseInt(item.sizeheight, 10) || 0;
    if (w >= 150 && h >= 150) score += 1;

    if (score > 0) {
      scoredCandidates.push({
        imageUrl: item.thumbnail || item.link,
        title: titleClean,
        score
      });
    }
  }

  if (scoredCandidates.length === 0) return null;

  scoredCandidates.sort((a, b) => b.score - a.score);
  return scoredCandidates[0].imageUrl;
}

/**
 * DB 및 코어 라이브러리에서 부품의 기준 가격과 스펙을 조회하는 헬퍼
 * (검색 결과로 가격/스펙을 임의 결정하지 않고 DB 데이터를 우선 사용)
 */
let cachedCoreLibrary = null;
function getCoreLibrary() {
  if (!cachedCoreLibrary) {
    try {
      const libPath = path.join(__dirname, '../data/corePartsLibrary.json');
      cachedCoreLibrary = JSON.parse(fs.readFileSync(libPath, 'utf8'));
    } catch (_) {
      cachedCoreLibrary = {};
    }
  }
  return cachedCoreLibrary;
}

function estimateDbPrice(partName, partType, specs = {}) {
  if (specs?.Price > 0) return Number(specs.Price);
  if (specs?.estimatedPrice > 0) return Number(specs.estimatedPrice);
  if (specs?.price > 0) return Number(specs.price);

  const nameUpper = String(partName || '').toUpperCase();
  const typeKey = String(partType || '').toLowerCase();
  const defaultPrices = {
    cpu: 250000, gpu: 400000, motherboard: 180000, ram: 110000,
    storage: 110000, psu: 100000, cooler: 50000, case: 60000
  };

  if (typeKey === 'gpu') {
    if (nameUpper.includes('5090')) return 4000000;
    if (nameUpper.includes('5080')) return 1800000;
    if (nameUpper.includes('5070 TI') || nameUpper.includes('5070TI')) return 1300000;
    if (nameUpper.includes('5070')) return 1000000;
    if (nameUpper.includes('4090')) return 2800000;
    if (nameUpper.includes('4080')) return 1500000;
    if (nameUpper.includes('4070 TI') || nameUpper.includes('4070TI')) return 1100000;
    if (nameUpper.includes('4070 SUPER')) return 900000;
    if (nameUpper.includes('4070')) return 800000;
    if (nameUpper.includes('4060 TI') || nameUpper.includes('4060TI')) return 550000;
    if (nameUpper.includes('4060')) return 400000;
    if (nameUpper.includes('3060')) return 300000;
    if (nameUpper.includes('7900 XTX')) return 1400000;
    if (nameUpper.includes('7800 XT')) return 750000;
    if (nameUpper.includes('7600')) return 350000;
    if (specs?.performance_score) return Number(specs.performance_score) * 8000;
  } else if (typeKey === 'cpu') {
    if (nameUpper.includes('9800X3D')) return 700000;
    if (nameUpper.includes('9950X')) return 1000000;
    if (nameUpper.includes('7800X3D')) return 580000;
    if (nameUpper.includes('14900K')) return 850000;
    if (nameUpper.includes('9700X')) return 520000;
    if (nameUpper.includes('14700K')) return 580000;
    if (nameUpper.includes('9600X')) return 350000;
    if (nameUpper.includes('7500F')) return 210000;
    if (nameUpper.includes('14400F')) return 260000;
    if (specs?.performance_score) return Number(specs.performance_score) * 4000;
  }

  return defaultPrices[typeKey] || 100000;
}

async function lookupDbPartPriceAndSpecs(partName, partType) {
  const typeKey = String(partType || '').toLowerCase();

  // 1. 코어 라이브러리 확인
  const coreLib = getCoreLibrary();
  const coreList = coreLib[typeKey] || [];
  const nameUpper = String(partName || '').toUpperCase();
  const matchedCore = coreList.find(
    c => nameUpper.includes(String(c.search_keyword || c.name || '').toUpperCase()) ||
         String(c.name || '').toUpperCase().includes(nameUpper)
  );

  // 2. Supabase parts 테이블 확인
  if (supabase && partName) {
    try {
      const { data: dbPart } = await supabase
        .from('parts')
        .select('id, name, category, specs, manufacturer')
        .ilike('name', `%${partName.split(' ').slice(0, 3).join('%')}%`)
        .limit(1)
        .maybeSingle();

      if (dbPart) {
        const dbPrice = estimateDbPrice(dbPart.name || partName, typeKey, {
          ...matchedCore,
          ...(dbPart.specs || {})
        });
        return {
          name: dbPart.name || partName,
          price: Number(dbPrice),
          specs: dbPart.specs || {}
        };
      }
    } catch (_) {}
  }

  if (matchedCore) {
    return {
      name: matchedCore.name || partName,
      price: estimateDbPrice(matchedCore.name || partName, typeKey, matchedCore),
      specs: matchedCore
    };
  }

  return {
    name: partName,
    price: estimateDbPrice(partName, typeKey, {}),
    specs: {}
  };
}

/**
 * 네이버 이미지 검색 API를 통해 검증된 부품 썸네일과 네이버 쇼핑 검색 결과 링크를 반환
 * - 가격과 스펙은 절대 이미지 검색 결과로 결정하지 않으며(price: null 반환),
 *   호출측(또는 DB 조회)에서 Supabase DB / 코어 라이브러리 데이터를 우선 사용함
 */
async function searchPart(rawKeyword, partType = 'cpu', display = 10) {
  const defaultImage = getDefaultPartImage(partType);
  const shoppingLink = buildShoppingSearchUrl(rawKeyword, partType);

  if (!rawKeyword || isGenericPlaceholderName(rawKeyword)) {
    return {
      name: rawKeyword || '',
      price: null,
      image: defaultImage,
      link: shoppingLink,
      isDefaultImage: true
    };
  }

  let keyword = sanitizeKeyword(rawKeyword);
  // 검색어가 너무 길면 핵심 브랜드+모델명 앞 5단어로 축약해 이미지 매칭률 향상
  const words = keyword.split(' ').filter(Boolean);
  if (words.length > 5) {
    keyword = words.slice(0, 5).join(' ');
  }

  const cacheKey = `img_${partType}_${keyword}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return {
      name: rawKeyword,
      price: null,
      image: defaultImage,
      link: shoppingLink,
      isDefaultImage: true
    };
  }

  try {
    const res = await enqueueNaverRequest(() =>
      axios.get(NAVER_IMAGE_API_URL, {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        },
        params: {
          query: keyword,
          display,
          sort: 'sim'
        },
        timeout: 4000
      })
    );

    try {
      const usageTracker = require('./usageTracker');
      usageTracker.log({ api_type: 'naver_shopping', endpoint: '/search/image' });
    } catch (_) {}

    const items = res.data?.items || [];
    const matchedImageUrl = selectBestMatchingImage(items, rawKeyword, keyword);

    const resultData = {
      name: rawKeyword,
      price: null, // 가격은 반드시 DB/코어 라이브러리 값을 우선 사용하도록 null 유지
      image: matchedImageUrl || defaultImage,
      link: shoppingLink,
      isDefaultImage: !matchedImageUrl
    };

    cache.set(cacheKey, { data: resultData, timestamp: Date.now() });
    return resultData;
  } catch (err) {
    const status = err.response?.status;
    console.warn(`[Naver Image API Fallback] Keyword: "${keyword}" (status: ${status || err.message}) -> 기본 이미지로 대체합니다.`);
    return {
      name: rawKeyword,
      price: null,
      image: defaultImage,
      link: shoppingLink,
      isDefaultImage: true
    };
  }
}

/**
 * 부품 목록 검색 (Supabase DB 및 코어 라이브러리 데이터를 우선 조회하고,
 * 각 항목에 검증된 썸네일 및 네이버 쇼핑 검색 링크를 결합)
 */
async function searchPartList(keyword, partType, page = 1, display = 20) {
  const typeKey = String(partType || 'cpu').toLowerCase();
  const cleanKw = String(keyword || '').trim();
  if (!cleanKw) return { items: [], total: 0, page };

  const tokens = cleanKw.toUpperCase().split(/\s+/).filter(Boolean);
  const results = [];
  const seenNames = new Set();

  // 1. 코어 라이브러리 데이터 우선 검색
  const coreLib = getCoreLibrary();
  const coreItems = coreLib[typeKey] || [];
  for (const item of coreItems) {
    const candidateName = item.name || item.search_keyword || '';
    const upper = candidateName.toUpperCase();
    if (tokens.every(t => upper.includes(t)) && !seenNames.has(upper)) {
      seenNames.add(upper);
      results.push({
        name: candidateName,
        price: estimateDbPrice(candidateName, typeKey, item),
        specs: item,
        image: getDefaultPartImage(typeKey),
        link: buildShoppingSearchUrl(candidateName, typeKey)
      });
    }
  }

  // 2. Supabase parts 테이블 검색
  if (supabase) {
    try {
      const dbCategoryMap = {
        cpu: 'CPU', gpu: 'GPU', ram: 'RAM', motherboard: 'Motherboard',
        storage: 'Storage', psu: 'PSU', cooler: 'CPUCooler', case: 'PCCase'
      };
      const dbCategory = dbCategoryMap[typeKey] || partType;
      const { data: dbRows } = await supabase
        .from('parts')
        .select('id, name, category, specs')
        .eq('category', dbCategory)
        .ilike('name', `%${tokens[0]}%`)
        .limit(40);

      for (const row of dbRows || []) {
        const upper = String(row.name || '').toUpperCase();
        if (tokens.every(t => upper.includes(t)) && !seenNames.has(upper)) {
          seenNames.add(upper);
          const dbPrice = estimateDbPrice(row.name, typeKey, row.specs || {});
          results.push({
            db_id: row.id,
            name: row.name,
            price: Number(dbPrice),
            specs: row.specs || {},
            image: getDefaultPartImage(typeKey),
            link: buildShoppingSearchUrl(row.name, typeKey)
          });
        }
      }
    } catch (err) {
      console.warn('[searchPartList] Supabase query warning:', err.message);
    }
  }

  const start = (page - 1) * display;
  const pagedItems = results.slice(start, start + display);

  // 상위 5개 결과에 대해 네이버 이미지 API 썸네일 보강
  await Promise.all(
    pagedItems.slice(0, 5).map(async item => {
      const imgData = await searchPart(item.name, typeKey, 5);
      if (imgData?.image) {
        item.image = imgData.image;
      }
    })
  );

  return {
    items: pagedItems,
    total: results.length,
    page
  };
}

module.exports = {
  searchPart,
  searchPartList,
  getDefaultPartImage,
  buildShoppingSearchUrl,
  lookupDbPartPriceAndSpecs
};
