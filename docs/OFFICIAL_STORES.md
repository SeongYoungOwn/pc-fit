# 공식 판매처 링크 관리

## 화면 동작

제품 상세와 가격 페이지는 front/src/components/domain/DeviceOffers.vue를 공유합니다. 주소 선택은 front/src/services/officialStores.mjs에서 담당합니다.

- 제조사 공식몰: 삼성·Apple·LG·ASUS. 모바일 세 품목에는 SKT·KT·LG U+도 표시합니다.
- 확인된 제품 ID와 판매처 조합은 제품 구매 페이지로 연결하고 “제품 구매 페이지”라고 표시합니다.
- 확인된 조합이 없으면 버튼을 유지하고 공식몰 홈으로 연결합니다. 버튼 아래에 “제품 페이지 미확인 · 공식몰 홈으로 이동”을 표시합니다.
- 미확인 상태가 제품이 없다는 확정 판정은 아닙니다. 자동 검색·실시간 재고 판정은 하지 않습니다.
- 다른 세대로 전환되는 공통 구매 URL을 이전 제품에 연결하지 않습니다. 품절 확인 주소는 홈으로 대체합니다.

## 제품별 확인 주소

| 제품 ID | 제품 | 판매처 및 구매 주소 |
| --- | --- | --- |
| official_apple_125089 | iPhone 17 | [Apple](https://www.apple.com/kr/shop/buy-iphone/iphone-17) |
| official_apple_121029 | iPhone 16 | [Apple](https://www.apple.com/kr/shop/buy-iphone/iphone-16) |
| official_apple_125092 | iPhone Air | [Apple](https://www.apple.com/kr/shop/buy-iphone/iphone-air) |
| official_apple_122240 | iPad(A16) | [Apple](https://www.apple.com/kr/shop/buy-ipad/ipad) |
| 65d7299fce4ffc3791ad6c99 | Galaxy S24 5G | [SKT · 256GB 구성](https://shop.tworld.co.kr/buyproc/prod-detail?categoryId=20010014&productGrpId=000006332&stepSeq=1&subcommDcMthd=30&subscriptionId=NA00008100&usingSubscriptionExYn=Y) |

검수 기준: 각 페이지의 제품명과 구매 구성을 대조했습니다. KT S24 자급제 페이지는 품절 표시를 확인하여 홈 연결을 유지했습니다. MacBook Air 공통 구매 페이지는 M5로 바뀌어 카탈로그의 M4·M3·M2에 사용하지 않습니다. 이 기록은 모든 판매처의 현재 재고를 보증하지 않습니다.

## 주소 추가 및 유지보수

1. 카탈로그 제품 ID와 모델·세대·국내 판매 구성을 확인합니다.
2. 공식몰의 실제 제품 페이지를 열어 상품명·용량·구매 가능 조건·품절 여부를 확인합니다. 제조사 지원 문서는 구매 페이지로 사용하지 않습니다.
3. productPages에 해당 ID와 판매처 이름의 정확한 조합을 등록합니다. 임의 검색 URL이나 다른 세대 주소로 채우지 않습니다.
4. 모델명과 URL을 이 문서에 기록하고 front/test/officialStores.test.mjs를 실행합니다.
5. 판매 종료·주소 변경 시 해당 조합을 제거하면 공식몰 홈으로 자동 복귀합니다.

가격 후보는 다나와 조회 흐름과 별도로 동작합니다. 이 버튼만으로 최저가·재고·제휴 API가 연동된 것으로 표시하지 않습니다.
