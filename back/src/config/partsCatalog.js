const PART_CATEGORIES = [
  ['CPU', 'CPUs', 'CPU', 'mdi-cpu-64-bit', 'cpu'],
  ['Motherboard', 'Motherboards', '메인보드', 'mdi-developer-board', 'motherboard'],
  ['RAM', 'Memory', 'RAM', 'mdi-memory', 'ram'],
  ['GPU', 'GPUs', '그래픽카드', 'mdi-expansion-card', 'gpu'],
  ['Storage', 'Storage', 'SSD · HDD', 'mdi-harddisk', 'storage'],
  ['PSU', 'PowerSupplies', '파워서플라이', 'mdi-power-plug', 'psu'],
  ['CPUCooler', 'CPUCoolers', 'CPU 쿨러', 'mdi-fan', 'cooler'],
  ['PCCase', 'PCCases', 'PC 케이스', 'mdi-desktop-tower', 'case'],
  ['CaseFan', 'CaseFans', '케이스 팬', 'mdi-fan', 'fan'],
  ['Monitor', 'Displays', '모니터', 'mdi-monitor'],
  ['Laptop', 'Laptops', '노트북', 'mdi-laptop'],
  ['PrebuiltDesktop', 'Desktops', '완제품 데스크톱', 'mdi-desktop-classic'],
  ['Keyboard', 'Keyboards', '키보드', 'mdi-keyboard'],
  ['Mouse', 'Mice', '마우스', 'mdi-mouse'],
  ['Headphones', 'Headphones', '헤드폰 · 헤드셋', 'mdi-headphones'],
  ['Webcam', 'Webcams', '웹캠', 'mdi-webcam'],
  ['Speaker', 'Speakers', '스피커', 'mdi-speaker'],
  ['Microphone', 'Microphones', '마이크', 'mdi-microphone'],
  ['NetworkCard', 'NetworkCards', '네트워크 카드', 'mdi-ethernet'],
  ['SoundCard', 'SoundCards', '사운드 카드', 'mdi-expansion-card'],
  ['CaptureCard', 'CaptureCards', '캡처 카드', 'mdi-video-input-hdmi'],
  ['VRHeadset', 'VRHeadsets', 'VR 헤드셋', 'mdi-virtual-reality'],
  ['ThermalCompound', 'ThermalCompounds', '써멀 컴파운드', 'mdi-water']
].map(([sourceCategory, value, label, icon, partType]) => ({ sourceCategory, value, label, icon, partType, source: 'BuildCores OpenDB' }));
const SOURCE_URL = 'https://github.com/buildcores/buildcores-open-db';
const LICENSE_URL = `${SOURCE_URL}/blob/main/LICENSE.txt`;
module.exports = { PART_CATEGORIES, SOURCE_URL, LICENSE_URL };
