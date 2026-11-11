# 제품 API 안내

기준 코드: `back/src/routes/deviceRoutes.js`, `back/src/app.js`. 제품 API는 `/api/devices`와 `/api/v1/devices` 두 접두사를 지원합니다. 아래 예시는 첫 번째를 사용합니다.

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/devices/meta` | 분류·브랜드 등 목록 조회용 정보 |
| GET | `/api/devices/products` | 품목·검색어·브랜드에 맞는 제품 목록 |
| GET | `/api/devices/products/:id` | 제품 상세 |
| GET | `/api/devices/compare` | 동일 품목 2~3개 사양 비교 |
| GET | `/api/devices/products/:id/offers` | 외부 판매 후보와 이동 링크 |
| POST | `/api/devices/import` | 관리자 수집. TechSpecs 비용·허가 확인 필요 |
| PATCH | `/api/devices/products/:id/domestic-availability` | 관리자 국내 출시 근거 검수 |

## 조회 예시

```text
GET /api/devices/products?category=Laptops&brand=Samsung
GET /api/devices/products?category=Smartphones&query=갤럭시
GET /api/devices/products?category=CPUs&query=AMD
GET /api/devices/compare?category=Laptops&ids=첫번째ID,두번째ID
```

ID는 목록 응답에서 받은 값을 사용하고 URL 값은 인코딩합니다. IT 품목 코드는 `Smartphones`, `Laptops`, `Tablets`, `Smartwatches`입니다. 비교는 동일 품목의 서로 다른 제품만 허용합니다.

제품 라우터의 정상 응답은 `{ success: true, data: ... }`, 오류는 `{ success: false, code: ..., error: ... }`입니다. health는 별도 `{ status: 'ok', timestamp: ... }` 형태입니다. 조회 제한·잘못된 입력·로그인/관리자 권한에 따른 오류를 처리해야 합니다.

가격 응답에 후보가 없으면 실제 최저가를 확정할 수 없습니다. 네이버 검색 링크를 가격 데이터 수신 성공으로 처리하지 않습니다. 예시 가격 차트를 실제 시계열 API 응답으로 사용하지 않습니다.

## 한국어 사양 표시

기기 상세 응답의 specGroups는 화면 표시용 한국어 그룹·항목·단위와 출처를 제공합니다. 원본 사양은 보존하며 모델 코드·규격 명칭까지 임의 번역하지 않습니다. 공식 판매처 버튼의 주소 선택은 프론트엔드 officialStores.mjs에서 처리하고 가격 후보 API와 분리합니다.
