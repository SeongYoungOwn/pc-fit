const CATEGORIES = [
  { value: 'Smartphones', label: '스마트폰', icon: 'mdi-cellphone', recentYears: 5, domesticOnly: true },
  { value: 'Tablets', label: '태블릿', icon: 'mdi-tablet', recentYears: 5, domesticOnly: true },
  { value: 'Smartwatches', label: '스마트워치', icon: 'mdi-watch', recentYears: 5, domesticOnly: true },
  { value: 'Laptops', label: '노트북', icon: 'mdi-laptop', recentYears: 5, domesticOnly: true },
  { value: 'Desktops', label: '데스크톱', icon: 'mdi-desktop-tower' },
  { value: 'Displays', label: '모니터 · TV', icon: 'mdi-monitor' },
  { value: 'GPUs', label: '그래픽카드', icon: 'mdi-expansion-card' }
];

function getCatalogConfig() {
  return {
    apiId: (process.env.TECHSPECS_API_ID || '').trim(),
    apiKey: (process.env.TECHSPECS_API_KEY || '').trim(),
    storageAllowed: process.env.TECHSPECS_STORAGE_ALLOWED === 'true'
  };
}

module.exports = { CATEGORIES, getCatalogConfig };
