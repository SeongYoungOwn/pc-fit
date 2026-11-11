const reviewedFacts = require('../data/reviewedSpecFacts');

const LABELS = {
  Product: '제품 정보', Manufacturer: '제조사', 'OEM ID': '제조사 제품 코드',
  Brand: '브랜드', Region: '지역', Country: '국가', Category: '제품 종류', Model: '모델명',
  Version: '모델 번호', 'SIM Type': 'SIM 구성', 'Release Date': '출시일',
  Design: '크기 및 무게', Body: '본체', Height: '세로', Width: '가로', Weight: '무게',
  Thickness: '두께', 'IP Rating': '방수·방진 등급', Colors: '색상',
  Inside: '내부 사양', Software: '소프트웨어', OS: '운영체제', 'OS Version': '운영체제 버전',
  'Additional Features': '추가 기능', Processor: '프로세서', CPU: '프로세서(CPU)',
  GPU: '그래픽(GPU)', 'CPU Clock Speed': 'CPU 동작 속도', 'GPU Clock Speed': 'GPU 동작 속도',
  RAM: '메모리(RAM)', Type: '종류', 'Clock Speed': '동작 속도', Capacity: '용량',
  Storage: '저장 용량', Audio: '오디오', 'AV Out': '영상·음성 출력 단자',
  'AV Resolution': '영상 출력 해상도', Channel: '오디오 채널', Microphone: '마이크',
  'ADC Frequency': '아날로그·디지털 변환 샘플링 주파수(ADC)', 'ADC Resolution': '아날로그·디지털 변환 비트 깊이(ADC)',
  'DAC Frequency': '디지털·아날로그 변환 샘플링 주파수(DAC)', 'DAC Resolution': '디지털·아날로그 변환 비트 깊이(DAC)',
  Output: '출력 단자', 'Hearing Aid Compatibility': '보청기 호환 등급',
  Cellular: '이동통신', 'SIM Frequencies': '지원 통신 주파수', Chip: '칩',
  'SIM Mobile Data': '모바일 데이터 규격', 'SIM Slot': 'SIM 슬롯', Carrier: '통신사',
  Generation: '이동통신 세대', Wireless: '무선 연결', 'Bluetooth Version': '블루투스 버전',
  WiFi: 'Wi-Fi 규격', 'Bluetooth Module': '블루투스 칩', 'WLAN Module': 'Wi-Fi 칩',
  'WiFi Features': 'Wi-Fi 기능', 'Bluetooth Profiles': '블루투스 프로파일', Experiences: '기타 무선 기능',
  Port: '단자', 'USB Type': 'USB 단자 형태', 'USB Version': 'USB 규격', 'USB Features': 'USB 기능',
  Battery: '배터리 및 충전', 'Charging Power': '유선 충전 전력',
  'Wireless Charging': '무선 충전', Current: '전류', Energy: '배터리 에너지',
  'Energy (Wh)': '배터리 에너지', 'Wireless Charging Power': '무선 충전 전력',
  Life: '배터리 사용 시간', Voltage: '전압', Style: '장착 방식',
  'Video playback': '동영상 재생 시간', 'Typical usage': '일반 사용 시간',
  Location: '위치 확인', Sensors: '센서', Display: '디스플레이',
  'Dynamic Range': '다이내믹 레인지', 'Punch hole': '펀치홀 개수', Subpixels: '서브픽셀 배열',
  Glass: '커버 유리', 'Pixel Size': '픽셀 크기', 'Screen to Body Ratio': '화면 면적 비율',
  'Resolution (H x W)': '해상도', 'Color Depth': '색 심도', 'Number of Colors': '표시 색상 수',
  Illumination: '발광 방식', 'Pixel Density': '픽셀 밀도', 'Bezel Width': '베젤 너비',
  Module: '모듈', Diagonal: '화면 크기(대각선)', 'Diagonal (cm)': '화면 크기(대각선)',
  'LCD Mode': 'LCD 방식', 'Refresh Rate': '주사율', Touchpoints: '동시 터치 지점 수',
  'Touch screen Type': '터치스크린 방식', Camera: '카메라',
  'Back Camera': '후면 카메라', 'Back Camera II': '후면 카메라 2',
  'Back Camera III': '후면 카메라 3', 'Back Camera IV': '후면 카메라 4', 'Front Camera': '전면 카메라',
  Focus: '초점 방식', 'Equivalent Focal Length': '환산 초점 거리',
  'Minimum Focal Length': '최소 초점 거리', 'Video Format': '동영상 형식',
  'Video Resolution': '동영상 촬영 해상도', 'Image Format': '사진 형식',
  Zoom: '줌', Flash: '플래시', 'Aperture (W)': '조리개 값',
  Features: '지원 기능', Resolution: '카메라 화소', 'Sensor Format': '센서 크기', Sensor: '센서 유형',
  No: '미지원 기능', 'SIM II Frequencies': '듀얼 SIM', Expansion: '저장 공간 확장',
  'FM Radio': 'FM 라디오', Price: '가격 참고', 'Raw Price': '원본 등록 가격',
  'Key Aspects': '원본 요약', 'Wireless & Cellular': '무선 연결 및 이동통신'
};

const FIELD_LABELS = {
  'Display / Type': '패널 종류',
  'Inside / RAM / Capacity': '메모리 용량(RAM)',
  'Inside / RAM / Type': '메모리 규격',
  'Inside / Storage / Capacity': '저장 용량',
  'Inside / Storage / Type': '저장장치 종류',
  'Inside / Battery / Capacity': '배터리 용량',
  'Inside / Battery / Type': '배터리 유형',
  'Inside / Location / Additional Features': '지원 위성 항법',
  'Inside / Sensors / Sensors': '지원 센서'
};

const VALUE_LABELS = {
  'South Korea': '대한민국', Asia: '아시아', Smartphones: '스마트폰', Tablets: '태블릿',
  Laptops: '노트북', Smartwatches: '스마트워치', Single: '싱글 SIM', Dual: '듀얼 SIM',
  'Dual SIM': '듀얼 SIM', 'e-SIM (embedded)': '내장형 eSIM', stereo: '스테레오',
  'Non-removable': '내장형(분리 불가)', 'Lithium-ion': '리튬 이온', 'Lithium-ion — 1 cell': '리튬 이온(1셀)',
  'Self-illuminating': '자체 발광', Capacitive: '정전식', 'single LED': '단일 LED',
  'Type C': 'USB-C', 'FM Radio': 'FM 라디오', 'Expandable Storage': '저장 공간 확장',
  charging: '충전', 'fast charging': '고속 충전', 'Qi wireless charging': 'Qi 무선 충전',
  'PMA wireless charging': 'PMA 무선 충전', 'Laser Autofocus': '레이저 자동 초점',
  'Phase-Detection Autofocus (PD AF)': '위상차 자동 초점(PDAF)',
  'Optical Image Stabilization (OIS)': '광학식 손떨림 보정(OIS)',
  'Electronic Image Stabilizer (EIS)': '전자식 손떨림 보정(EIS)',
  'Video Stabilizer (EIS)': '전자식 동영상 흔들림 보정(EIS)',
  'Video Stabilizer (OIS)': '광학식 동영상 흔들림 보정(OIS)',
  'HDR photo': 'HDR 사진', 'HDR video': 'HDR 동영상', 'Slow motion video': '슬로 모션 동영상',
  'Burst mode': '연속 촬영', 'Touch focus': '터치 초점', 'Macro mode': '접사 모드',
  'Panorama Photo': '파노라마 사진', 'Face detection': '얼굴 인식', 'Face tagging': '얼굴 태그',
  'Smile detection': '미소 감지', 'Intelligent scene detection': '장면 자동 인식',
  Barometer: '기압계', 'In-screen fingerprint sensor': '화면 내 지문 센서',
  'Hall sensor': '홀 센서', 'Light intensity sensor': '조도 센서', 'Proximity sensor': '근접 센서',
  'Step counter': '걸음 수 측정', Accelerometer: '가속도 센서', Compass: '나침반',
  Gyroscope: '자이로 센서', 'Voice Command': '음성 명령'
};

const IGNORED_KEYS = new Set([
  '_provenance', 'identifiers', 'opendb_id', 'general_product_information', 'id', '_id',
  'english_id', 'added_on', 'updated_at', 'Is Translated', 'Image', 'Images', 'Thumbnail'
]);
const UNIT_SUFFIX = /_(mAh|MHz|mm|in|g|oz|W|PPI|MP|%|f\/)$/;
const UNITS = { in: '인치', oz: '온스', 'f/': 'f/' };
const GROUPS = ['성능 및 저장 공간', '디스플레이', '카메라', '배터리 및 충전',
  '크기 및 무게', '연결 및 센서', '제품 정보', '미지원 기능', '가격 참고', '기타 사양'];
const CONNECTIONS = new Set(['Audio', 'Cellular', 'Wireless', 'Port', 'Location', 'Sensors']);

function knownLabel(labels, key) {
  return Object.hasOwn(labels, key) ? labels[key] : key;
}

function specText(value) {
  if (typeof value === 'boolean') return value ? '지원' : '미지원';
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const input = String(value).trim();
  return !input || /^(the data will be added shortly|n\/?a|unknown|undefined|null|[-–—])$/i.test(input) ? null : input;
}

function formatSpecValue(value, path = '') {
  if (value === null) return null;
  const unit = path.match(UNIT_SUFFIX)?.[1];
  if (unit && /^-?\d+(?:\.\d+)?$/.test(value)) {
    if (unit === 'f/') return `f/${value}`;
    const label = path.endsWith('Energy_W') ? 'Wh' : UNITS[unit] || unit;
    return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2, useGrouping: false }).format(Number(value))} ${label}`;
  }
  return value.replace(/[^,]+/g, item => {
    const text = item.trim();
    return text ? item.replace(text, knownLabel(VALUE_LABELS, text)) : item;
  })
    .replace(/(\d)\s*(inches|inch(?:\(es\))?|ounces|hours?|volts?|pixels?|micrometers?|bit)(?![a-z])/gi,
      (match, number, unit) => {
        const key = unit.toLowerCase();
        if (key.startsWith('inch')) return `${number}인치`;
        if (key === 'ounces') return `${number}온스`;
        if (key.startsWith('hour')) return `${number}시간`;
        if (key.startsWith('volt')) return `${number} V`;
        if (key.startsWith('pixel')) return `${number}픽셀`;
        if (key.startsWith('micrometer')) return `${number} μm`;
        return `${number}비트`;
      });
}

function specLabel(path, compact = false) {
  const segments = path.split(' / ');
  const unit = segments.at(-1).match(UNIT_SUFFIX)?.[1];
  if (unit) segments[segments.length - 1] = segments.at(-1).replace(UNIT_SUFFIX, '');
  const parent = segments.at(-2);
  const fullPath = segments.join(' / ');
  let label = FIELD_LABELS[fullPath] || knownLabel(LABELS, segments.at(-1));
  if (compact && FIELD_LABELS[fullPath]) return label;
  if (parent === 'Sensors' && label === '센서') label = '지원 센서';
  if (unit && !compact) label += ` (${fullPath === 'Inside / Battery / Energy' ? 'Wh' : UNITS[unit] || unit})`;
  const parentLabels = segments.slice(0, -1);
  if (compact && (segments[0] === 'Inside' || GROUPS.includes(knownLabel(LABELS, segments[0])))) parentLabels.shift();
  const context = compact ? parentLabels.filter(key => !['Body', 'Battery', 'Sensors', 'Processor'].includes(key)) : parentLabels;
  return [...context.map(key => knownLabel(LABELS, key)), label]
    .filter((item, index, items) => item !== items[index + 1])
    .join(' · ');
}

function flattenSpecs(raw) {
  const result = new Map();
  function walk(value, path = []) {
    if (result.size >= 500 || path.length > 8) return;
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (!IGNORED_KEYS.has(key)) walk(child, [...path, Array.isArray(value) ? `옵션 ${Number(key) + 1}` : key]);
      }
      return;
    }
    const display = specText(value);
    if (path.length && display !== null) result.set(path.join(' / '), display);
  }
  walk(raw);
  return result;
}

function detailGroup(path) {
  const [root, section] = path.split(' / ');
  if (root === 'Inside') {
    if (section === 'Battery') return '배터리 및 충전';
    if (CONNECTIONS.has(section)) return '연결 및 센서';
    return '성능 및 저장 공간';
  }
  const label = knownLabel(LABELS, root);
  return GROUPS.includes(label) ? label : '기타 사양';
}

function formatDeviceSpecGroups(product) {
  const entries = flattenSpecs(product.specs);
  const groups = new Map(GROUPS.map(title => [title, []]));
  for (const [path, raw] of entries) {
    if (path.startsWith('Key Aspects / ') && path !== 'Key Aspects / Release Date') continue;
    const basePath = path.replace(UNIT_SUFFIX, '');
    // Providers include a numeric copy of many fields for filtering; the readable field already has units.
    if (basePath !== path && entries.has(basePath)) continue;
    const fact = basePath === 'Inside / Battery / Charging Power'
      ? reviewedFacts.find(item => item.brand === product.brand && item.version === product.version && item.field === 'charging')
      : null;
    const label = path === 'Key Aspects / Release Date' ? '출시일' : specLabel(path, true);
    const group = path === 'Key Aspects / Release Date' ? '제품 정보' : detailGroup(path);
    groups.get(group).push({
      key: path, label, value: fact?.display || formatSpecValue(raw, path),
      ...(fact ? { sourceUrl: fact.sourceUrl } : {})
    });
  }
  return [...groups].filter(([, rows]) => rows.length).map(([title, rows]) => ({ title, rows }));
}

module.exports = { flattenSpecs, formatDeviceSpecGroups, formatSpecValue, specLabel, specText };
