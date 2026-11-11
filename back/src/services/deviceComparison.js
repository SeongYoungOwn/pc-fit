const { field } = require('./techSpecsNormalizer');
const reviewedFacts = require('../data/reviewedSpecFacts');
const { flattenSpecs, formatSpecValue, specLabel, specText: text } = require('./deviceSpecPresentation');

function at(object, path) { return path.split('.').reduce((value, key) => field(value, key), object); }
// Only one unambiguous number with the expected unit is comparable.
function numberWithUnit(value, unit) {
  const input = text(value);
  if (!input) return null;
  if (/\d\s*(?:\/|~|\bor\b)\s*\d/i.test(input)) return null;
  const matches = [...input.matchAll(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`, 'gi'))];
  if (matches.length !== 1) return null;
  return Number(matches[0][1]);
}
function readCell(product, def) {
  let value;
  for (const path of def.paths) {
    const candidate = at(product.specs, path);
    if (text(candidate)) { value = candidate; break; }
  }
  let numeric = null;
  if (def.unit) numeric = typeof value === 'number' && Number.isFinite(value) ? value : numberWithUnit(value, def.unit);
  const display = text(value);
  const reviewed = reviewedFacts.find(fact => fact.brand === product.brand && fact.version === product.version && fact.field === def.key);
  if (reviewed) return { display: reviewed.display, numeric: reviewed.value, available: true,
    originalDisplay: display, source: reviewed.source, sourceUrl: reviewed.sourceUrl, checkedOn: reviewed.checkedOn };
  return { display: display === null ? '공식 자료 미확인' : typeof value === 'number' && def.suffix ? `${Number(value.toFixed(2))} ${def.suffix}` : formatSpecValue(display),
    numeric, available: display !== null, ...(display && product.sourceUrl ? {sourceUrl:product.sourceUrl,source:product.source}: {}) };
}

const CORE_FIELDS = [
  { key: 'os', label: '운영체제', group: '기본 · 성능', paths: ['Inside.Software.OS Version', 'Inside.Software.OS'] },
  { key: 'cpu', label: '프로세서', group: '기본 · 성능', paths: ['Inside.Processor.CPU'] },
  { key: 'gpu', label: '그래픽', group: '기본 · 성능', paths: ['Inside.Processor.GPU'] },
  { key: 'ram', label: 'RAM', group: '기본 · 성능', paths: ['Inside.RAM.Capacity'], unit: 'GB', suffix: 'GB' },
  { key: 'storage', label: '저장 용량 옵션', group: '기본 · 성능', paths: ['Inside.Storage.Capacity'] },
  { key: 'screen', label: '화면 크기', group: '디스플레이', paths: ['Display.Diagonal'], unit: 'inch(?:es)?', suffix: '인치' },
  { key: 'screen-cm', label: '화면 대각선(cm)', group: '디스플레이', paths: ['Display.Diagonal (cm)'] },
  { key: 'panel', label: '패널', group: '디스플레이', paths: ['Display.Type'] },
  { key: 'resolution', label: '해상도', group: '디스플레이', paths: ['Display.Resolution (H x W)'] },
  { key: 'refresh', label: '주사율', group: '디스플레이', paths: ['Display.Refresh Rate'], unit: 'Hz', suffix: 'Hz' },
  { key: 'camera', label: '후면 카메라 화소', group: '카메라', paths: ['Camera.Back Camera.Resolution'], unit: 'MP', suffix: 'MP' },
  { key: 'front-camera', label: '전면 카메라 화소', group: '카메라', paths: ['Camera.Front Camera.Resolution'] },
  { key: 'video', label: '후면 영상 촬영', group: '카메라', paths: ['Camera.Back Camera.Video Resolution'] },
  { key: 'battery', label: '배터리 용량', group: '배터리 · 충전', paths: ['Inside.Battery.Capacity_mAh', 'Inside.Battery.Capacity'], unit: 'mAh', suffix: 'mAh' },
  { key: 'battery-wh', label: '배터리 에너지', group: '배터리 · 충전', paths: ['Inside.Battery.Energy (Wh)'] },
  { key: 'video-time', label: '동영상 재생 시간(제조사)', group: '배터리 · 충전', paths: ['Inside.Battery.Video playback'] },
  { key: 'usage-time', label: '일반 사용 시간(제조사)', group: '배터리 · 충전', paths: ['Inside.Battery.Typical usage'] },
  { key: 'charging', label: '유선 충전 전력', group: '배터리 · 충전', paths: ['Inside.Battery.Charging Power_W', 'Inside.Battery.Charging Power'], unit: 'W', suffix: 'W' },
  { key: 'wireless-charging', label: '무선 충전', group: '배터리 · 충전', paths: ['Inside.Battery.Wireless Charging'] },
  { key: 'weight', label: '무게', group: '휴대성 · 연결', paths: ['Design.Body.Weight_g', 'Design.Body.Weight'], unit: 'g', suffix: 'g' },
  { key: 'thickness', label: '두께', group: '휴대성 · 연결', paths: ['Design.Body.Thickness_mm', 'Design.Body.Thickness'], unit: 'mm', suffix: 'mm' },
  { key: 'protection', label: '방수 · 방진', group: '휴대성 · 연결', paths: ['Design.Body.IP Rating'] },
  { key: 'bluetooth', label: '블루투스', group: '휴대성 · 연결', paths: ['Inside.Wireless.Bluetooth Version'] },
  { key: 'sensors', label: '센서', group: '휴대성 · 연결', paths: ['Inside.Sensors.Sensors'] }
];

function buildComparison(products) {
  const rows = CORE_FIELDS.map(def => {
    const cells = products.map(p => readCell(p, def));
    return { key: def.key, label: def.label, group: def.group, cells,
      different: new Set(cells.map(c => !c.available ? null : c.numeric !== null ? c.numeric : c.display.replace(/\s+/g, '').toLowerCase())).size > 1 };
  });
  // Highlights describe measured specification differences, not an invented overall score.
  const highlights = products.map(() => []);
  const descriptions = { weight: '더 가벼움', battery: '더 큰 배터리 용량', screen: '더 큰 화면', ram: '더 큰 RAM 용량', charging: '더 높은 충전 전력' };
  for (const [key, description] of Object.entries(descriptions)) {
    const row = rows.find(r => r.key === key), values = row.cells.map(c => c.numeric);
    if (values.some(v => v === null) || new Set(values).size < 2) continue;
    const target = key === 'weight' ? Math.min(...values) : Math.max(...values);
    values.forEach((value, index) => { if (value === target) highlights[index].push({ key, text: description, value: row.cells[index].display }); });
  }
  const flattened = products.map(p => flattenSpecs(p.specs));
  const paths = [...new Set(flattened.flatMap(map => [...map.keys()]))].sort();
  const detailedRows = paths.slice(0, 500).map(path => {
    const cells = flattened.map(map => ({ display: map.has(path) ? formatSpecValue(map.get(path), path) : '정보 미제공', available: map.has(path) }));
    return { key: path, label: specLabel(path), cells, different: new Set(flattened.map(map => map.get(path))).size > 1 };
  });
  return { products: products.map(({ specs, ...summary }) => summary), rows, highlights, detailedRows,
    notices: ['동일 모델에서도 저장 용량·지역·판매 옵션에 따라 사양이 달라질 수 있습니다.',
      '배터리 용량은 실사용 시간, 카메라 화소는 사진 품질을 의미하지 않습니다.',
      '판매 조건은 가격 페이지에서 확인할 수 있습니다. 종합 성능 점수는 추정하지 않습니다.',
      '공식 자료 링크에서 옵션별 사양과 측정 조건을 확인하세요. 출시 기록은 현재 재고를 보장하지 않습니다.'] };
}
module.exports = { buildComparison, numberWithUnit };
