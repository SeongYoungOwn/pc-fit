const { PART_CATEGORIES, SOURCE_URL, LICENSE_URL } = require('../config/partsCatalog');
const { searchTokens } = require('./deviceSearch');

function partTokens(query) {
  let value = String(query || '');
  const aliases = [['라이젠', 'Ryzen'], ['인텔', 'Intel'], ['코어', 'Core'], ['지포스', 'GeForce'], ['라데온', 'Radeon'],
    ['기가바이트', 'Gigabyte'], ['에즈락', 'ASRock'], ['애즈락', 'ASRock'], ['킹스톤', 'Kingston'],
    ['커세어', 'Corsair'], ['하이닉스', 'Hynix'], ['프랙탈', 'Fractal'], ['씨게이트', 'Seagate'], ['크루셜', 'Crucial']];
  for (const [ko, en] of aliases) value = value.split(ko).join(` ${en} `);
  value=value.replace(/\b(RTX|GTX|RX)(?=\d)/gi,'$1 ').replace(/\b(i[3579])-(?=\d)/gi,'$1 ');
  return searchTokens(value).map(token => token.toLowerCase());
}
const text = value => typeof value === 'string' ? value.trim() : '';
function highlights(raw, category) {
  const result = [];
  const add = (label, value, unit = '') => { if (value !== undefined && value !== null && value !== '' && value !== 0) result.push(`${label} ${value}${unit}`); };
  if (category === 'CPU') { add('소켓', raw.socket); add('코어', raw.cores?.total); add('스레드', raw.cores?.threads); add('TDP', raw.specifications?.tdp, 'W'); }
  if (category === 'Motherboard') { add('소켓', raw.socket); add('칩셋', raw.chipset); add('메모리', raw.memory?.ram_type); add('규격', raw.form_factor); }
  if (category === 'RAM') { add('메모리', raw.ram_type); add('용량', raw.capacity, 'GB'); add('속도', raw.speed, 'MT/s'); add('모듈', raw.modules?.quantity, '개'); }
  if (category === 'GPU') { add('칩셋', raw.chipset); add('VRAM', raw.memory, 'GB'); add('TDP', raw.tdp, 'W'); add('길이', raw.length, 'mm'); }
  if (category === 'Storage') { add('종류', raw.storage_type || raw.type); add('용량', raw.capacity, 'GB'); add('인터페이스', raw.interface); add('규격', raw.form_factor); }
  if (category === 'PSU') { add('정격', raw.wattage, 'W'); add('효율', raw.efficiency_rating); add('규격', raw.form_factor); }
  if (category === 'PCCase') { add('규격', raw.form_factor); add('GPU 공간', raw.max_video_card_length, 'mm'); add('쿨러 공간', raw.max_cpu_cooler_height, 'mm'); }
  if (category === 'CPUCooler') { add('높이', raw.height, 'mm'); add('라디에이터', raw.radiator_size, 'mm'); add('소켓', raw.cpu_sockets?.join(', ')); }
  if (category === 'Monitor') { add('화면', raw.screen_size, '인치'); add('해상도', raw.resolution?.horizontalRes && `${raw.resolution.horizontalRes}×${raw.resolution.verticalRes}`); add('주사율', raw.refresh_rate, 'Hz'); add('패널', raw.panel_type); }
  return result.slice(0, 4);
}
function normalizePart(raw, sourceCategory, revision, filename) {
  const category = PART_CATEGORIES.find(c => c.sourceCategory === sourceCategory);
  if (!category || !/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Invalid source metadata');
  if (!/^[a-f0-9-]{36}$/i.test(raw.opendb_id || '') || !text(raw.metadata?.name)) throw new Error('Invalid product');
  const id = `opendb_${raw.opendb_id}`;
  const year = Number(raw.metadata.releaseYear);
  const releaseDate = Number.isInteger(year) && year >= 1970 && year <= 2100 ? String(year) : null;
  const brand = text(raw.metadata.manufacturer) || '제조사 미제공';
  const name = text(raw.metadata.name);
  return { id, category: category.value, sourceCategory, partType: category.partType || null, brand, name,
    model: name, version: (raw.metadata.part_numbers || []).filter(x => typeof x === 'string').join(' · '),
    releaseDate, specs: raw, highlights: highlights(raw, sourceCategory),
    source: 'BuildCores OpenDB', sourceRevision: revision,
    sourceUrl: `${SOURCE_URL}/blob/${revision}/open-db/${sourceCategory}/${filename || `${raw.opendb_id}.json`}`,
    manufacturerUrl: /^https:\/\//i.test(raw.general_product_information?.manufacturer_url || '') ? raw.general_product_information.manufacturer_url : null,
    license: 'CC BY-NC-SA 4.0', licenseUrl: LICENSE_URL, availability: 'unverified',
    imageUrl: null, price: null, priceStatus: 'unavailable',
    searchText: [name, brand, ...(raw.metadata.part_numbers || [])].join(' ').toLowerCase() };
}
function toBuilderPart(product) {
  const raw = product.specs;
  const specs = { ...raw };
  if (raw.socket) { specs.socket = raw.socket; specs.Socket = raw.socket; }
  if (product.sourceCategory === 'CPU') {
    if (raw.specifications?.tdp) specs.tdp = raw.specifications.tdp;
    const integrated = raw.specifications?.integratedGraphics?.model;
    if (typeof integrated === 'string') specs.has_igpu = !/^(none|no|n\/a)$/i.test(integrated);
  }
  if (product.sourceCategory === 'Motherboard') { specs.ramType = raw.memory?.ram_type; specs.memory_type = raw.memory?.ram_type; }
  if (product.sourceCategory === 'RAM') { specs.type = raw.ram_type; specs.memory_type = raw.ram_type; }
  if (product.sourceCategory === 'PSU') specs.total_wattage = raw.wattage;
  if (product.sourceCategory === 'PCCase') { specs.max_gpu_length = raw.max_video_card_length; specs.max_cooler_height = raw.max_cpu_cooler_height; }
  if (product.sourceCategory === 'CPUCooler') specs.socket = raw.cpu_sockets;
  return { ...specs, id: product.id, db_id: product.id, name: product.name, manufacturer: product.brand,
    category: product.sourceCategory, type: product.partType, specs, price: null, priceStatus: 'unavailable',
    source: product.source, sourceUrl: product.sourceUrl, licenseUrl: product.licenseUrl,
    highlights: product.highlights, syncedAt: product.syncedAt };
}
function formatPartSpecs(raw, sourceCategory) {
  const labels = { series:'시리즈', microarchitecture:'마이크로아키텍처', coreFamily:'코드명', socket:'소켓',
    cores:'코어', total:'전체', performance:'성능 코어', efficiency:'효율 코어', threads:'스레드', clocks:'클럭', base:'기본', boost:'부스트',
    cache:'캐시', specifications:'세부 사양', tdp:'TDP', ppt:'최대 소켓 전력', integratedGraphics:'내장 그래픽', model:'모델',
    baseClock:'기본 클럭', boostClock:'부스트 클럭', shaderCount:'셰이더 수', eccSupport:'ECC 지원', includesCooler:'쿨러 포함',
    packaging:'패키지', lithography:'제조 공정', simultaneousMultithreading:'동시 멀티스레딩', memory:'메모리', maxSupport:'최대 지원 용량',
    types:'지원 종류', channels:'채널', chipset_manufacturer:'GPU 칩 제조사', chipset:'칩셋', memory_type:'메모리 종류', ram_type:'메모리 종류',
    core_base_clock:'기본 코어 클럭', core_boost_clock:'부스트 코어 클럭', effective_memory_clock:'메모리 클럭', memory_bus:'메모리 버스',
    interface:'인터페이스', color:'색상', lighting:'조명', length:'길이', height:'높이', total_slot_width:'점유 슬롯', cooling:'냉각 방식',
    power_connectors:'전원 단자', video_outputs:'영상 출력', form_factor:'규격', max:'최대 용량', slots:'슬롯 수', pcie_slots:'PCIe 슬롯',
    gen:'세대', quantity:'개수', lanes:'레인', m2_slots:'M.2 슬롯', size:'크기', key:'키', storage_devices:'저장장치 연결',
    onboard_ethernet:'유선 네트워크', speed:'속도', controller:'컨트롤러', wireless_networking:'무선 네트워크', usb_headers:'USB 헤더',
    fan_headers:'팬 헤더', bios_features:'BIOS 기능', flashback:'BIOS 플래시백', clear_cmos:'CMOS 초기화', audio:'오디오',
    back_panel_ports:'후면 단자', capacity:'용량', modules:'모듈 구성', capacity_gb:'모듈당 용량', cas_latency:'CAS 지연', timings:'타이밍',
    voltage:'전압', ecc:'ECC', registered:'레지스터', heat_spreader:'방열판', rgb:'RGB', profile_support:'메모리 프로파일',
    storage_type:'저장장치 종류', nvme:'NVMe', wattage:'정격 출력', efficiency_rating:'효율 인증', modular:'모듈러 방식',
    fanless:'팬리스', connectors:'연결 단자', cpu_sockets:'지원 CPU 소켓', water_cooled:'수랭', radiator_size:'라디에이터 크기',
    min_fan_rpm:'최저 팬 회전수', max_fan_rpm:'최대 팬 회전수', min_noise_level:'최저 소음', max_noise_level:'최대 소음',
    supported_motherboard_form_factors:'지원 메인보드 규격', max_video_card_length:'최대 그래픽카드 길이', max_cpu_cooler_height:'최대 CPU 쿨러 높이',
    supported_power_supply_form_factors:'지원 파워 규격', power_supply:'파워 포함', side_panel:'측면 패널', dimensions:'치수', dimensions_mm:'치수',
    width:'너비', depth:'깊이', volume:'부피', weight:'무게 (원본값)', screen_size:'화면 크기', resolution:'해상도', horizontalRes:'가로', verticalRes:'세로',
    refresh_rate:'주사율', panel_type:'패널', response_time:'응답 시간', viewing_angle:'시야각', aspect_ratio:'화면 비율', max_brightness:'최대 밝기', adaptive_sync:'가변 주사율' };
  const units = { 'specifications.tdp':'W', 'specifications.ppt':'W', tdp:'W', wattage:'W', length:'mm',height:'mm',
    max_video_card_length:'mm',max_cpu_cooler_height:'mm',radiator_size:'mm',screen_size:'인치',refresh_rate:'Hz',response_time:'ms',
    'cores.total':'개','cores.threads':'개','specifications.memory.maxSupport':'GB','memory.max':'GB',capacity:'GB','modules.capacity_gb':'GB',
    'cache.l2':'MB','cache.l3':'MB','clocks.performance.base':'GHz','clocks.performance.boost':'GHz',
    'clocks.efficiency.base':'GHz','clocks.efficiency.boost':'GHz',core_base_clock:'MHz',core_boost_clock:'MHz',effective_memory_clock:'MHz' };
  if (sourceCategory === 'GPU') units.memory='GB';
  if (sourceCategory === 'RAM') { units.speed='MT/s'; units.voltage='V'; }
  const rows=[];
  function walk(value,keys=[]) {
    if (value == null || value === '' || rows.length>=500) return;
    if (Array.isArray(value) && value.every(v=>typeof v!=='object')) {
      if (value.length) rows.push({label:keys.map(k=>labels[k] || k).join(' / '),value:value.join(', ')});
    } else if (typeof value==='object') {
      for (const [key,child] of Object.entries(value)) {
        if (['metadata','identifiers','opendb_id','general_product_information'].includes(key)) continue;
        walk(child,[...keys,key]);
      }
    } else rows.push({label:keys.map(k=>labels[k] || k).join(' / '),value:typeof value==='boolean' ? (value ? '지원':'미지원') : `${value}${units[keys.join('.')] ? ` ${units[keys.join('.')]}` : ''}`});
  }
  walk(raw); return rows;
}
module.exports = { normalizePart, partTokens, toBuilderPart, highlights, formatPartSpecs };
