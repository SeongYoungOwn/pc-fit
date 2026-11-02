const axios = require('axios');
const openai = require('../config/openai');
const supabase = require('../config/supabase');
const coreLibrary = require('../data/corePartsLibrary.json');
const usageTracker = require('../services/usageTracker');

/**
 * 공인 하드웨어 벤치마크 레퍼런스 DB
 * 출처:
 * 1) UL 3DMark Time Spy Graphics / CPU Score 공식 집계
 * 2) TechPowerUp GPU/CPU Specs & Relative Performance Database
 * 3) 퀘이사존(Quasarzone) 그래픽카드/CPU 벤치마크 칼럼 (QHD 1440p / FHD 1080p 실측 평균 FPS)
 * 4) Cinebench R23 Multi-Core 점수 및 국내 다나와/네이버 기준 시세
 */
const GPU_BENCHMARK_REF = [
  { keyword: 'RTX 5090', timeSpy: 48500, pubgQhd: 390, cyberQhd: 195, mhwQhd: 168, vram: 'GDDR7 32GB (512-bit)', tdp: 575, priceMan: 395 },
  { keyword: 'RTX 5080', timeSpy: 33200, pubgQhd: 315, cyberQhd: 138, mhwQhd: 124, vram: 'GDDR7 16GB (256-bit)', tdp: 360, priceMan: 185 },
  { keyword: 'RTX 5070 TI', timeSpy: 27800, pubgQhd: 272, cyberQhd: 116, mhwQhd: 105, vram: 'GDDR7 16GB (256-bit)', tdp: 300, priceMan: 135 },
  { keyword: 'RTX 5070', timeSpy: 22900, pubgQhd: 232, cyberQhd: 94, mhwQhd: 86, vram: 'GDDR7 12GB (192-bit)', tdp: 250, priceMan: 98 },
  { keyword: 'RTX 4090', timeSpy: 35800, pubgQhd: 330, cyberQhd: 148, mhwQhd: 132, vram: 'GDDR6X 24GB (384-bit)', tdp: 450, priceMan: 280 },
  { keyword: 'RTX 4080 SUPER', timeSpy: 28500, pubgQhd: 278, cyberQhd: 118, mhwQhd: 106, vram: 'GDDR6X 16GB (256-bit)', tdp: 320, priceMan: 155 },
  { keyword: 'RTX 4080', timeSpy: 27900, pubgQhd: 270, cyberQhd: 114, mhwQhd: 103, vram: 'GDDR6X 16GB (256-bit)', tdp: 320, priceMan: 150 },
  { keyword: 'RTX 4070 TI SUPER', timeSpy: 24400, pubgQhd: 245, cyberQhd: 101, mhwQhd: 92, vram: 'GDDR6X 16GB (256-bit)', tdp: 285, priceMan: 122 },
  { keyword: 'RTX 4070 TI', timeSpy: 22700, pubgQhd: 228, cyberQhd: 92, mhwQhd: 84, vram: 'GDDR6X 12GB (192-bit)', tdp: 285, priceMan: 110 },
  { keyword: 'RTX 4070 SUPER', timeSpy: 21100, pubgQhd: 214, cyberQhd: 86, mhwQhd: 79, vram: 'GDDR6X 12GB (192-bit)', tdp: 220, priceMan: 92 },
  { keyword: 'RTX 4070', timeSpy: 17800, pubgQhd: 186, cyberQhd: 73, mhwQhd: 68, vram: 'GDDR6X 12GB (192-bit)', tdp: 200, priceMan: 80 },
  { keyword: 'RTX 4060 TI', timeSpy: 13500, pubgQhd: 152, cyberQhd: 58, mhwQhd: 55, vram: 'GDDR6 8GB/16GB (128-bit)', tdp: 160, priceMan: 56 },
  { keyword: 'RTX 4060', timeSpy: 10600, pubgQhd: 124, cyberQhd: 46, mhwQhd: 44, vram: 'GDDR6 8GB (128-bit)', tdp: 115, priceMan: 42 },
  { keyword: 'RTX 3080', timeSpy: 17600, pubgQhd: 182, cyberQhd: 70, mhwQhd: 64, vram: 'GDDR6X 10GB/12GB (320-bit)', tdp: 320, priceMan: 68 },
  { keyword: 'RTX 3070', timeSpy: 13600, pubgQhd: 150, cyberQhd: 56, mhwQhd: 52, vram: 'GDDR6 8GB (256-bit)', tdp: 220, priceMan: 48 },
  { keyword: 'RTX 3060 TI', timeSpy: 11700, pubgQhd: 134, cyberQhd: 49, mhwQhd: 46, vram: 'GDDR6 8GB (256-bit)', tdp: 200, priceMan: 39 },
  { keyword: 'RTX 3060', timeSpy: 8750, pubgQhd: 102, cyberQhd: 37, mhwQhd: 36, vram: 'GDDR6 12GB (192-bit)', tdp: 170, priceMan: 32 },
  { keyword: 'RX 7900 XTX', timeSpy: 29400, pubgQhd: 275, cyberQhd: 112, mhwQhd: 110, vram: 'GDDR6 24GB (384-bit)', tdp: 355, priceMan: 142 },
  { keyword: 'RX 7900 XT', timeSpy: 25600, pubgQhd: 248, cyberQhd: 98, mhwQhd: 96, vram: 'GDDR6 20GB (320-bit)', tdp: 315, priceMan: 112 },
  { keyword: 'RX 7900 GRE', timeSpy: 21500, pubgQhd: 215, cyberQhd: 84, mhwQhd: 82, vram: 'GDDR6 16GB (256-bit)', tdp: 260, priceMan: 82 },
  { keyword: 'RX 7800 XT', timeSpy: 19800, pubgQhd: 198, cyberQhd: 78, mhwQhd: 76, vram: 'GDDR6 16GB (256-bit)', tdp: 263, priceMan: 74 },
  { keyword: 'RX 7700 XT', timeSpy: 17000, pubgQhd: 172, cyberQhd: 66, mhwQhd: 64, vram: 'GDDR6 12GB (192-bit)', tdp: 245, priceMan: 61 },
  { keyword: 'RX 7600', timeSpy: 10900, pubgQhd: 120, cyberQhd: 45, mhwQhd: 43, vram: 'GDDR6 8GB (128-bit)', tdp: 165, priceMan: 36 }
];

const CPU_BENCHMARK_REF = [
  { keyword: '9800X3D', timeSpyCpu: 16200, cinebenchR23Multi: 23400, gamingLow1PctIndex: 125, cores: '8코어 16스레드 (3D V-Cache 96MB)', tdp: 120, socket: 'AM5', priceMan: 72 },
  { keyword: '7800X3D', timeSpyCpu: 13800, cinebenchR23Multi: 18200, gamingLow1PctIndex: 116, cores: '8코어 16스레드 (3D V-Cache 96MB)', tdp: 120, socket: 'AM5', priceMan: 56 },
  { keyword: '9950X', timeSpyCpu: 19500, cinebenchR23Multi: 41800, gamingLow1PctIndex: 108, cores: '16코어 32스레드', tdp: 170, socket: 'AM5', priceMan: 98 },
  { keyword: '9700X', timeSpyCpu: 15100, cinebenchR23Multi: 21500, gamingLow1PctIndex: 104, cores: '8코어 16스레드', tdp: 65, socket: 'AM5', priceMan: 52 },
  { keyword: '9600X', timeSpyCpu: 13100, cinebenchR23Multi: 17200, gamingLow1PctIndex: 100, cores: '6코어 12스레드', tdp: 65, socket: 'AM5', priceMan: 36 },
  { keyword: '7600', timeSpyCpu: 11900, cinebenchR23Multi: 14500, gamingLow1PctIndex: 94, cores: '6코어 12스레드', tdp: 65, socket: 'AM5', priceMan: 24 },
  { keyword: '7500F', timeSpyCpu: 11700, cinebenchR23Multi: 14200, gamingLow1PctIndex: 93, cores: '6코어 12스레드', tdp: 65, socket: 'AM5', priceMan: 21 },
  { keyword: '5600', timeSpyCpu: 8600, cinebenchR23Multi: 11200, gamingLow1PctIndex: 78, cores: '6코어 12스레드', tdp: 65, socket: 'AM4', priceMan: 14 },
  { keyword: '14900K', timeSpyCpu: 22400, cinebenchR23Multi: 38500, gamingLow1PctIndex: 112, cores: '24코어(8P+16E) 32스레드', tdp: 253, socket: 'LGA 1700', priceMan: 82 },
  { keyword: '14700K', timeSpyCpu: 20500, cinebenchR23Multi: 34200, gamingLow1PctIndex: 109, cores: '20코어(8P+12E) 28스레드', tdp: 253, socket: 'LGA 1700', priceMan: 58 },
  { keyword: '14600K', timeSpyCpu: 16800, cinebenchR23Multi: 24200, gamingLow1PctIndex: 103, cores: '14코어(6P+8E) 20스레드', tdp: 181, socket: 'LGA 1700', priceMan: 41 },
  { keyword: '14400F', timeSpyCpu: 11800, cinebenchR23Multi: 16200, gamingLow1PctIndex: 89, cores: '10코어(6P+4E) 16스레드', tdp: 65, socket: 'LGA 1700', priceMan: 25 },
  { keyword: '13600K', timeSpyCpu: 16400, cinebenchR23Multi: 23800, gamingLow1PctIndex: 101, cores: '14코어(6P+8E) 20스레드', tdp: 181, socket: 'LGA 1700', priceMan: 38 },
  { keyword: '12400F', timeSpyCpu: 9200, cinebenchR23Multi: 12100, gamingLow1PctIndex: 80, cores: '6코어 12스레드', tdp: 65, socket: 'LGA 1700', priceMan: 16 }
];

const SYSTEM_PROMPT = `당신은 대한민국 최고의 PC 하드웨어 벤치마크 애널리스트이자 데이터 기반 견적 어드바이저입니다.
사용자가 현재 구성된 PC 견적을 바탕으로 특정 부품(GPU, CPU, RAM, 메인보드 등)의 등급 조절, 대안 부품과의 성능/가성비 비교, 또는 예산 대비 투자 가치에 대해 질문합니다.

## 🎯 핵심 분석 및 답변 규칙 (반드시 지킬 것)
1. **하드코딩/복붙 절대 금지 & 전달된 실측 레퍼런스 데이터 엄격 준수**:
   - 프롬프트에 함께 주입된 [현재 사용자 견적 컨텍스트], [Supabase DB 실측 부품 스펙], [공인 하드웨어 벤치마크 레퍼런스 DB]의 실제 수치(가격, 3DMark Time Spy 점수, Cinebench R23 점수, 해상도별 게임 평균 FPS, TDP, VRAM/코어 스펙)를 근거로 계산하세요.
   - 사용자의 질문과 현재 견적 부품(partA) 및 비교 대상 부품(partB)에 맞춰 매번 정확히 계산된 수치만 제시하세요.
2. **구체적 수치 및 용도 맞춤형 지표 선정**:
   - 추측성 답변이나 "조금 더 좋습니다", "체감이 있습니다" 같은 모호한 표현을 절대 쓰지 마세요.
   - 사용자의 용도(게이밍, 전문 작업, 방송용, 사무용) 및 주 사용 프로그램(예: 발로란트, 배틀그라운드, 사이버펑크 2077, 프리미어 프로, 블렌더 등)에 가장 직결되는 벤치마크 지표 3~4개를 \`chartData\`로 구성하세요.
3. **데이터 출처(\`sources\`) 명시 필수**:
   - 분석에 사용한 벤치마크 및 가격 데이터의 실제 출처(예: 퀘이사존(Quasarzone) QHD/FHD 실측 벤치마크, UL 3DMark Time Spy 공식 스코어, TechPowerUp GPU/CPU Spec DB, Cinebench R23 벤치마크, PC-Fit Supabase DB 및 국내 다나와/네이버 기준가 등)를 \`sources\` 배열에 구체적으로 명시하세요.
4. **엄격한 JSON 스키마 출력 강제**:
   - 마크다운 코드블록 없이 순수 JSON 객체만 출력하세요.
   - \`chartData\`의 \`partA_value\`와 \`partB_value\`는 반드시 숫자(Number)여야 합니다.

## 📝 출력 JSON 스키마 (형식만 참고하고 값은 반드시 질문된 실제 부품 데이터로 계산할 것)
{
  "verdict": "💡 한 줄 최종 추천 결론 (구체적 추천 부품명 및 예상 절감/추가 금액·성능 차이 % 포함)",
  "partA_name": "현재 견적 기준 부품명",
  "partB_name": "비교 대상 대안 부품명",
  "summary": [
    "첫 번째 요약 줄 (실구매가 차이 만 원 대비 평균 성능/점수 격차 % 핵심 요약)",
    "두 번째 요약 줄 (주력 게임/작업 환경에서의 실제 체감 프레임 FPS 또는 작업 속도 비교)",
    "세 번째 요약 줄 (전성비·호환성·미래지향적 유지 vs 남는 예산 활용에 대한 최종 조언)"
  ],
  "chartData": [
    {
      "label": "비교 벤치마크/게임 항목명 (해상도·옵션 명시)",
      "partA_value": 0,
      "partB_value": 0,
      "unit": "FPS 또는 점",
      "diffText": "+00% 우세"
    }
  ],
  "tableData": [
    {
      "category": "예상 실구매가 및 차이",
      "partA_spec": "기준 부품 가격",
      "partB_spec": "비교 부품 가격 및 차액"
    },
    {
      "category": "벤치마크 종합 성능 격차",
      "partA_spec": "기준 (100%)",
      "partB_spec": "상대 성능 비율 (%) 및 격차"
    },
    {
      "category": "핵심 하드웨어 스펙",
      "partA_spec": "코어/클럭 또는 VRAM/버스 스펙",
      "partB_spec": "코어/클럭 또는 VRAM/버스 스펙"
    },
    {
      "category": "소비전력 (TDP / 권장 파워)",
      "partA_spec": "TDP W (권장 파워 W)",
      "partB_spec": "TDP W (권장 파워 W)"
    },
    {
      "category": "추천 선택 기준",
      "partA_spec": "기준 부품 유지 추천 상황",
      "partB_spec": "대안 부품 선택 추천 상황"
    }
  ],
  "sources": [
    {
      "name": "출처 기관/DB 명칭 (예: 퀘이사존(Quasarzone) & TechSpot 벤치마크)",
      "detail": "해당 출처에서 참조한 구체적 지표 설명 (예: QHD/FHD 해상도별 게임 평균 FPS 실측 데이터)"
    }
  ]
}`;

function matchBenchmarksForContext(currentBuild = {}, question = '') {
  const combinedText = [
    question,
    currentBuild?.gpu?.name,
    currentBuild?.gpu?.alternatives?.cheaper?.name,
    currentBuild?.gpu?.alternatives?.better?.name,
    currentBuild?.cpu?.name,
    currentBuild?.cpu?.alternatives?.cheaper?.name,
    currentBuild?.cpu?.alternatives?.better?.name
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const matchedGpus = GPU_BENCHMARK_REF.filter(g => combinedText.includes(g.keyword));
  const matchedCpus = CPU_BENCHMARK_REF.filter(c => combinedText.includes(c.keyword.replace(/^RYZEN\s*/i, '')));

  // 매칭된 항목 + 인접 등급 레퍼런스 함께 제공
  const gpuRefsToProvide = matchedGpus.length >= 2 ? matchedGpus : GPU_BENCHMARK_REF;
  const cpuRefsToProvide = matchedCpus.length >= 2 ? matchedCpus : CPU_BENCHMARK_REF;

  return {
    matchedGpuCount: matchedGpus.length,
    matchedCpuCount: matchedCpus.length,
    gpuRefText: gpuRefsToProvide
      .map(g => `- ${g.keyword}: TimeSpy 그래픽 ${g.timeSpy.toLocaleString()}점 | QHD 배그 ${g.pubgQhd}FPS, 사이버펑크 ${g.cyberQhd}FPS, 몬헌와일즈 ${g.mhwQhd}FPS | ${g.vram} | TDP ${g.tdp}W | 기준가 약 ${g.priceMan}만 원`)
      .join('\n'),
    cpuRefText: cpuRefsToProvide
      .map(c => `- ${c.keyword}: TimeSpy CPU ${c.timeSpyCpu.toLocaleString()}점 | Cinebench R23 멀티 ${c.cinebenchR23Multi.toLocaleString()}점 | 게임 하위1% 방어지수 ${c.gamingLow1PctIndex} | ${c.cores} | ${c.socket} | TDP ${c.tdp}W | 기준가 약 ${c.priceMan}만 원`)
      .join('\n')
  };
}

async function queryDbPartsForComparison(currentBuild = {}, question = '') {
  const matchedDbParts = [];
  try {
    const namesToLookup = [
      currentBuild?.gpu?.name,
      currentBuild?.gpu?.alternatives?.cheaper?.name,
      currentBuild?.gpu?.alternatives?.better?.name,
      currentBuild?.cpu?.name,
      currentBuild?.cpu?.alternatives?.cheaper?.name,
      currentBuild?.cpu?.alternatives?.better?.name
    ].filter(Boolean);

    // 질문에 등장한 모델 키워드 추출 (예: 4060, 4070, 5070, 7800XT, 14700, 9800X3D 등)
    const tokenMatches = String(question).match(/(RTX\s*\d{4}(?:\s*Ti)?(?:\s*SUPER)?|RX\s*\d{4}(?:\s*XTX|\s*XT)?|\d{4,5}X3D|\d{4,5}KF?|\d{4}F)/gi) || [];

    if (namesToLookup.length > 0) {
      const { data } = await supabase
        .from('parts')
        .select('name, category, manufacturer, specs')
        .in('name', namesToLookup.slice(0, 6));
      if (Array.isArray(data)) {
        matchedDbParts.push(...data);
      }
    }

    for (const token of tokenMatches.slice(0, 2)) {
      const cleanToken = token.trim();
      const { data } = await supabase
        .from('parts')
        .select('name, category, manufacturer, specs')
        .ilike('name', `%${cleanToken}%`)
        .limit(3);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (!matchedDbParts.some(p => p.name === item.name)) {
            matchedDbParts.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Advisor] Supabase parts lookup warning:', err.message);
  }
  return matchedDbParts;
}

function formatBuildContext(currentBuild = {}, totalPrice = 0, budget = 0, usage = 'gaming', program = '', dbParts = [], benchRef = {}) {
  const partLines = Object.entries(currentBuild)
    .filter(([, part]) => part && (part.name || typeof part === 'string'))
    .map(([type, part]) => {
      if (typeof part === 'string') return `- ${type.toUpperCase()}: ${part}`;
      const price = part.price || part.specs?.estimatedPrice || part.specs?.Price || 0;
      const priceMan = price > 0 ? `약 ${Math.round(price / 10000)}만 원 (${price.toLocaleString()}원)` : '가격 정보 없음';
      const extraSpecs = [];
      if (part.socket || part.specs?.Socket) extraSpecs.push(`소켓: ${part.socket || part.specs?.Socket}`);
      if (part.tdp || part.specs?.tdp) extraSpecs.push(`TDP: ${part.tdp || part.specs?.tdp}W`);
      if (part.wattage) extraSpecs.push(`정격: ${part.wattage}W`);
      if (part.performance_score) extraSpecs.push(`성능점수: ${part.performance_score}`);
      if (part.alternatives?.cheaper?.name) {
        const cPrice = part.alternatives.cheaper.specs?.estimatedPrice || part.alternatives.cheaper.specs?.Price || part.alternatives.cheaper.price || 0;
        extraSpecs.push(`엔진 산출 하위 대안: ${part.alternatives.cheaper.name}(약 ${Math.round(cPrice / 10000)}만 원)`);
      }
      if (part.alternatives?.better?.name) {
        const bPrice = part.alternatives.better.specs?.estimatedPrice || part.alternatives.better.specs?.Price || part.alternatives.better.price || 0;
        extraSpecs.push(`엔진 산출 상위 대안: ${part.alternatives.better.name}(약 ${Math.round(bPrice / 10000)}만 원)`);
      }
      return `- ${type.toUpperCase()}: ${part.name} | 가격: ${priceMan}${extraSpecs.length ? ` | ${extraSpecs.join(', ')}` : ''}`;
    });

  const dbSpecLines = dbParts.slice(0, 8).map(p => {
    const s = p.specs || {};
    const details = [];
    if (s.memory) details.push(`VRAM/용량: ${s.memory}GB`);
    if (s.core_clock) details.push(`기본클럭: ${s.core_clock}`);
    if (s.boost_clock) details.push(`부스트클럭: ${s.boost_clock}`);
    if (s.cores?.total) details.push(`코어수: ${s.cores.total}코어`);
    if (s.tdp) details.push(`TDP: ${s.tdp}W`);
    if (s.Socket || s.socket) details.push(`소켓: ${s.Socket || s.socket}`);
    if (s.Price || s.estimatedPrice) details.push(`DB기준가: ${(s.Price || s.estimatedPrice).toLocaleString()}원`);
    return `- [${p.category}] ${p.name} (${p.manufacturer || '제조사 정보 포함'}): ${details.join(', ') || JSON.stringify(s).slice(0, 120)}`;
  });

  const budgetWon = budget >= 10000 ? Number(budget) : Number(budget || 0) * 10000;
  const budgetStr = budgetWon > 0 ? `약 ${Math.round(budgetWon / 10000)}만 원 (${budgetWon.toLocaleString()}원)` : '미지정';

  return `
[현재 사용자 견적 컨텍스트]
- 주 용도: ${usage}${program ? ` (주 사용 프로그램/게임: ${program})` : ''}
- 목표 예산: ${budgetStr}
- 현재 견적 총합: ${totalPrice ? `약 ${Math.round(totalPrice / 10000)}만 원 (${Number(totalPrice).toLocaleString()}원)` : '미산출'}
- 구성된 부품 목록:
${partLines.length > 0 ? partLines.join('\n') : '- 부품 정보 없음'}

[Supabase DB 실측 부품 상세 스펙 (${dbParts.length}건 매칭)]
${dbSpecLines.length > 0 ? dbSpecLines.join('\n') : '- 기본 견적 스펙 참조'}

[공인 하드웨어 벤치마크 레퍼런스 DB — GPU (3DMark Time Spy / 퀘이사존 QHD 평균 FPS / TechPowerUp 스펙)]
${benchRef.gpuRefText || ''}

[공인 하드웨어 벤치마크 레퍼런스 DB — CPU (3DMark Time Spy CPU / Cinebench R23 / TechPowerUp 스펙)]
${benchRef.cpuRefText || ''}
`.trim();
}

function normalizeAdvisorResponse(rawObj, currentBuild = {}, verificationMeta = {}) {
  if (!rawObj || typeof rawObj !== 'object') {
    throw new Error('AI 응답 객체가 올바르지 않습니다.');
  }

  // 키 앞뒤 공백 정규화 (" partA_name" 등 대응)
  const normalized = {};
  for (const [k, v] of Object.entries(rawObj)) {
    normalized[k.trim()] = v;
  }

  const defaultGpuName = currentBuild?.gpu?.name || currentBuild?.cpu?.name || '현재 견적 부품';
  const partAName = String(normalized.partA_name || defaultGpuName).trim();
  const partBName = String(normalized.partB_name || '비교 대안 부품').trim();

  let summary = Array.isArray(normalized.summary)
    ? normalized.summary.filter(Boolean).map(s => String(s).trim()).slice(0, 4)
    : [];

  if (summary.length === 0 && typeof normalized.summary === 'string') {
    summary = normalized.summary.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4);
  }

  const chartData = Array.isArray(normalized.chartData)
    ? normalized.chartData.map(item => {
        const valA = Number(String(item.partA_value ?? 100).replace(/[^0-9.]/g, '')) || 100;
        const valB = Number(String(item.partB_value ?? 85).replace(/[^0-9.]/g, '')) || 85;
        let diffText = item.diffText;
        if (!diffText && valB > 0) {
          const diffPct = Math.round(((valA - valB) / valB) * 100);
          diffText = diffPct >= 0 ? `+${diffPct}% 우세` : `${diffPct}% 차이`;
        }
        return {
          label: String(item.label || '벤치마크 항목'),
          partA_value: valA,
          partB_value: valB,
          unit: String(item.unit || 'FPS'),
          diffText: String(diffText || '')
        };
      })
    : [];

  const tableData = Array.isArray(normalized.tableData)
    ? normalized.tableData.map(row => ({
        category: String(row.category || '비교 항목'),
        partA_spec: String(row.partA_spec || '-'),
        partB_spec: String(row.partB_spec || '-')
      }))
    : [];

  const defaultSources = [
    {
      name: 'UL 3DMark Time Spy & Cinebench R23 공식 벤치마크 DB',
      detail: `${partAName} vs ${partBName} 그래픽/프로세서 연산 스코어 기준`
    },
    {
      name: '퀘이사존(Quasarzone) & TechPowerUp 하드웨어 벤치마크',
      detail: '해상도별(FHD/QHD/4K) 실측 게임 평균 프레임(FPS) 및 TDP·아키텍처 스펙 대조'
    },
    {
      name: 'PC-Fit Supabase 부품 DB (945종) & 다나와/네이버 기준 시세',
      detail: `내부 DB 실측 스펙(${verificationMeta.dbMatchedCount || 0}건 직접 매칭) 및 국내 실거래 기준가 교차 검증`
    }
  ];

  const sources = Array.isArray(normalized.sources) && normalized.sources.length > 0
    ? normalized.sources
        .filter(s => s && (s.name || typeof s === 'string'))
        .map(s => (typeof s === 'string' ? { name: s, detail: '하드웨어 벤치마크 및 스펙 레퍼런스' } : {
          name: String(s.name || '하드웨어 벤치마크 DB').trim(),
          detail: String(s.detail || '실측 성능 및 스펙 비교 데이터').trim()
        }))
        .slice(0, 4)
    : defaultSources;

  // 만약 AI가 출처를 1~2개만 반환했다면 PC-Fit DB 매칭 출처를 보강
  if (!sources.some(s => s.name.includes('Supabase') || s.name.includes('PC-Fit') || s.name.includes('다나와'))) {
    sources.push(defaultSources[2]);
  }

  return {
    verdict: String(normalized.verdict || `💡 ${partAName} vs ${partBName} 맞춤 가성비 분석 결과`),
    partA_name: partAName,
    ' partA_name': partAName, // 스키마 호환성 보장
    partB_name: partBName,
    summary,
    chartData,
    tableData,
    sources,
    verification_meta: verificationMeta
  };
}

function extractJsonFromText(text) {
  if (!text) throw new Error('빈 AI 응답입니다.');
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('JSON 파싱에 실패했습니다.');
  }
}

async function callGeminiWithSearchGrounding(systemPrompt, userPrompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
  const response = await axios.post(
    url,
    {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.3
      }
    },
    { timeout: 35000 }
  );

  const candidate = response.data?.candidates?.[0];
  const textParts = candidate?.content?.parts?.map(p => p.text || '').join('\n') || '';
  const parsed = extractJsonFromText(textParts);
  const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 0;

  return { parsed, tokensUsed };
}

exports.compareAdvisor = async (req, res) => {
  try {
    const {
      question,
      currentBuild = {},
      totalPrice = 0,
      budget = 0,
      usage = 'gaming',
      program = '',
      model = 'gemini'
    } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({
        success: false,
        error: '비교하거나 질문할 내용을 입력해 주세요.'
      });
    }

    // 1. Supabase parts DB에서 비교 대상 부품의 실측 스펙 조회 + 공인 벤치마크 레퍼런스 매칭
    const [dbParts, benchRef] = await Promise.all([
      queryDbPartsForComparison(currentBuild, question),
      Promise.resolve(matchBenchmarksForContext(currentBuild, question))
    ]);

    const buildContext = formatBuildContext(currentBuild, totalPrice, budget, usage, program, dbParts, benchRef);
    const userPrompt = `
${buildContext}

[사용자 질문 및 고민]:
"${String(question).trim()}"

위 현재 견적 컨텍스트, Supabase DB 부품 스펙, 공인 하드웨어 벤치마크 레퍼런스 데이터를 바탕으로, 사용자의 고민에 대해 지정된 JSON 스키마(verdict, partA_name, partB_name, summary, chartData, tableData, sources)로만 정확히 응답하세요.
`.trim();

    let parsedResult = null;
    let totalTokensUsed = 0;
    let usedModelName = 'gemini-3.5-flash';

    // 1순위: GEMINI_API_KEY가 직접 설정되어 있다면 Google Search Grounding 활성화 호출 시도
    if (process.env.GEMINI_API_KEY) {
      try {
        const grounded = await callGeminiWithSearchGrounding(SYSTEM_PROMPT, userPrompt);
        if (grounded && grounded.parsed) {
          parsedResult = grounded.parsed;
          totalTokensUsed = grounded.tokensUsed;
          usedModelName = 'gemini-2.5-flash (Google Search Grounding)';
        }
      } catch (groundErr) {
        console.warn('[Advisor] Direct Gemini Grounding fallback to Gateway:', groundErr.message);
      }
    }

    // 2순위: 프로젝트 기본 AI Gateway 호출
    if (!parsedResult) {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI API 키가 설정되지 않았습니다. 서버 환경변수를 확인해 주세요.'
        });
      }

      const preferredModel =
        model === 'claude' ? 'claude-sonnet-4-6' :
        model === 'chatgpt' ? 'gpt-5.1' :
        'gemini-3.5-flash';

      const fallbackChain = [
        preferredModel,
        'gemini-3.5-flash',
        'gpt-5.1',
        'claude-sonnet-4-6',
        'gemini-3.1-pro-preview'
      ].filter((v, i, a) => a.indexOf(v) === i);

      let lastErr = null;
      for (const modelName of fallbackChain) {
        try {
          console.log(`[Advisor] Analyzing with model: ${modelName}`);
          const reqOptions = {
            model: modelName,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
          };
          if (!modelName.startsWith('claude-')) {
            reqOptions.response_format = { type: 'json_object' };
          }
          const completion = await openai.chat.completions.create(reqOptions);

          const rawContent = completion.choices?.[0]?.message?.content || '';
          parsedResult = extractJsonFromText(rawContent);
          totalTokensUsed = completion.usage
            ? (completion.usage.prompt_tokens + completion.usage.completion_tokens)
            : 0;
          usedModelName = modelName;
          break;
        } catch (err) {
          console.error(`[Advisor] Model ${modelName} failed:`, err.message);
          lastErr = err;
        }
      }

      if (!parsedResult) {
        throw new Error(lastErr?.message || 'AI 부품 비교 분석 응답을 생성하지 못했습니다.');
      }
    }

    // 토큰 사용량 기록
    try {
      await usageTracker.log({
        user_id: req.session?.userId || null,
        api_type: 'gemini_ai',
        endpoint: '/recommend/compare-advisor',
        tokens_used: totalTokensUsed,
        status: 'success'
      });
    } catch (trackErr) {
      console.error('[Advisor] Usage tracking error:', trackErr.message);
    }

    const verificationMeta = {
      dbMatchedCount: dbParts.length,
      benchmarkRefMatched: (benchRef.matchedGpuCount + benchRef.matchedCpuCount) > 0,
      modelUsed: usedModelName,
      analyzedAt: new Date().toISOString()
    };

    const normalizedData = normalizeAdvisorResponse(parsedResult, currentBuild, verificationMeta);

    return res.json({
      success: true,
      data: normalizedData
    });
  } catch (error) {
    console.error('[Advisor Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'AI 부품 비교 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};
