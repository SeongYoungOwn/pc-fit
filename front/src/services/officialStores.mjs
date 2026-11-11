const manufacturers = {
  samsung: { name: '삼성닷컴', url: 'https://www.samsung.com/sec/' },
  apple: { name: 'Apple 공식 스토어', url: 'https://www.apple.com/kr/shop' },
  lg: { name: 'LG전자 공식 스토어', url: 'https://www.lge.co.kr/' },
  asus: { name: 'ASUS 공식 스토어', url: 'https://kr.store.asus.com/' }
};

const carriers = [
  { name: 'SKT T다이렉트샵', url: 'https://shop.tworld.co.kr/' },
  { name: 'KT닷컴', url: 'https://shop.kt.com/' },
  { name: 'LG U+ 공식 온라인 스토어', url: 'https://www.lguplus.com/' }
];

// shortcut: 수동 확인한 모델별 구매 주소만 사용하며, 판매 세대 변경 시 재검수한다.
const productPages = {
  official_apple_125089: { 'Apple 공식 스토어': 'https://www.apple.com/kr/shop/buy-iphone/iphone-17' },
  official_apple_121029: { 'Apple 공식 스토어': 'https://www.apple.com/kr/shop/buy-iphone/iphone-16' },
  official_apple_125092: { 'Apple 공식 스토어': 'https://www.apple.com/kr/shop/buy-iphone/iphone-air' },
  official_apple_122240: { 'Apple 공식 스토어': 'https://www.apple.com/kr/shop/buy-ipad/ipad' },
  '65d7299fce4ffc3791ad6c99': {
    'SKT T다이렉트샵': 'https://shop.tworld.co.kr/buyproc/prod-detail?categoryId=20010014&productGrpId=000006332&stepSeq=1&subcommDcMthd=30&subscriptionId=NA00008100&usingSubscriptionExYn=Y'
  }
};

export function officialStores(product) {
  const brand = String(product?.brand || '').trim().toLowerCase();
  const manufacturer = Object.hasOwn(manufacturers, brand) ? manufacturers[brand] : null;
  const mobile = ['Smartphones', 'Tablets', 'Smartwatches'].includes(product?.category);
  const pages = Object.hasOwn(productPages, product?.id) ? productPages[product.id] : {};
  const resolve = store => ({ ...store, url: pages[store.name] || store.url, isProductPage: Boolean(pages[store.name]) });
  return {
    manufacturer: manufacturer ? resolve(manufacturer) : null,
    carriers: mobile ? carriers.map(resolve) : []
  };
}
