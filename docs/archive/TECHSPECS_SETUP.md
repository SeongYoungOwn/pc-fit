> 과거 기록입니다. 현재 상태는 [프로젝트 현황](../PROJECT_STATUS.md), 실행 방법은 [학교 셋업](../SCHOOL_SETUP.md)을 확인하세요.

# TechSpecs 연동 현황과 실행 방법

> **최신 정정 (2026-11-07):** 사용자가 추가 유료 호출을 하지 않기로 선택했다. TechSpecs 추가 수집은 중단했다. 현재 `/devices`에는 별도 무료 공급처 BuildCores의 PC 부품·기기 47,436개도 연결되어 있다. 아래 ‘3개’는 TechSpecs 공개 스마트폰 수이며 전체 카탈로그 수가 아니다. 무료 DB 복원/현황은 [DATA_SOURCES.md](../DATA_SOURCES.md)를 따른다.

## 최신 상태: 실제 검색·기기 비교 구현 (2026-11-07)

사용자가 국내 모델 3개 수집과 실제 비교 검증을 새로 승인했다. 그 범위의 상세 API 3회만 추가 호출했다.
갤럭시 S24(SM-S921N)·S24+(SM-S926N)·S24 Ultra(SM-S928N)의 실제 스펙을 DB에 저장했다.
삼성전자서비스 공식 비교표의 모델 코드와 대조하고 국내 정발 근거 URL을 기록해 공개 처리했다.
현재 DB는 중국 W24 모델 1개(숨김) + 국내 S24 모델 3개(공개)다.

- `/devices`: 실제 3개 스마트폰 검색, 한글 제품명 별칭과 모델 코드 검색 지원.
- `/devices/compare`: 스마트폰·태블릿·스마트워치 비교 페이지.
- 최대 3개 동일 품목 선택, 주요 사양 표, 다른 항목 필터, 전체 원본 스펙, 공유 URL.
- 등록 제품에서 계산한 비교 바로가기이며, 인기/이용 통계를 만들어 표시하지 않는다.
- 비교 API는 DB만 읽는다. 방문할 때마다 외부 TechSpecs API를 호출하지 않는다.
- 최근 4년/국내 정발 조건은 목록·상세·비교 API 모두에서 적용한다.
- 실측 벤치마크·판매 가격·평점·종합 점수는 새로 만들지 않았다.
- 태블릿·스마트워치는 화면/로직과 가상 데이터 테스트를 구현했지만 실제 제품을 아직 수집하지 않았다.
- PC 견적을 유지하고 기기 비교·대여로 확장하는 것이 프로젝트 방향이며 대여 기능은 아직 미구현이다.
- 실제 브라우저에서 2개/3개 스마트폰 선택과 다른 항목 필터를 확인했다.
- 비교 데이터 원본 184개 항목(2개 기기 기준)을 제공하는 것을 확인했다.

### 공급 데이터 검수

실제 TechSpecs 응답에서 S24(SM-S921N)의 충전 전력이 45W로 제공됐으나 삼성 공식 자료는 25W다.
`back/src/data/reviewedSpecFacts.js`에 해당 모델·항목만 좁게 검수해 출처·확인일을 기록했다.
핵심 표는 검수값과 원본값을 함께 표시하고 원본 JSON은 수정하지 않는다.
다른 항목/모델이 모두 검증됐다는 뜻은 아니다. 추가 수집 후 같은 방식의 검수가 필요하다.

최신 테스트: 백엔드 25개 테스트 통과 및 프론트엔드 빌드 성공.
실제 제품/SQLite/키는 Git에서 제외한다. 현재 파일 변경은 아직 GitHub에 반영하지 않았다.

아래의 0개 제품/추가 호출 중단 기록은 이번 재개 승인 이전 상황이다.

## 최종 서비스 기준 (2026-11-07)

기존 PC 견적 기능에 IT 기기 카탈로그와 향후 대여 기능을 추가한다.
TechSpecs는 글로벌 스펙, 다나와는 국내 가격 데이터 후보, 네이버 쇼핑은 국내 가격 검색,
PhoneArena는 별도 라이선스 기반 스마트폰 정보 공급처 후보로 구상한다.
**이번에 실제 연결한 공급처는 TechSpecs뿐이다.** 다른 공급처를 새로 연결했다고 가정하지 않는다.

- 모든 브랜드를 대상으로 한다. Apple·Samsung만 허용하는 제한은 제거했다.
- 스마트폰·태블릿·스마트워치: 서울 날짜 기준 최근 4년 이내 출시 제품만 자동으로 포함한다.
- 노트북·데스크톱·모니터/TV·GPU: 위 4년 하한을 적용하지 않는다.
- 기간과 조회 방식은 사용자 선택 사항이 아니다. 화면은 저장된 DB만 검색한다.
- 스마트폰은 국내 정식 출시 확인 상태와 근거 URL이 있는 제품만 공개한다.
- 브랜드·지역 문자열이나 모델 접미사만 보고 국내 정발이라고 자동 확정하지 않는다.
- TechSpecs가 지원한다고 확인된 분류는 7개다. CPU·RAM·메인보드·카메라까지 모두 제공한다고 보장하지 않는다.

## 실제로 확인한 결과

- TechSpecs 계정 가입 후 사용자 승인으로 `PC-FIT graduation project` 키를 생성했다.
- 키 만료일: **2027-02-05**. 비밀값은 로컬 `back/.env`에만 저장했다.
- 실제 인증 요청, Samsung 제품 검색, 제품 상세 1건 수신에 성공했다.
- 실제 검색 응답은 `{status, total_results, total_pages, page, data: [...]}` 형식이다.
- 제품 상세 응답은 `data` 객체 안의 `_id`, `Product`, `Key Aspects` 등으로 구성된다.
- 현재 API는 페이지 크기 최소 10개를 요구한다. 문서 예시와 달라 코드를 보정했다.
- 실제 상세를 받은 `Samsung W24 5G / SM-W9024`를 개발용 로컬 DB에 저장하고 재조회했다.
- 이 제품은 응답에서 China 모델로 확인됐고 국내 정발 검증을 하지 않았으므로 공개 목록에 표시하지 않는다.
- 갤럭시 S24 국내 모델 3개의 검색 결과도 확인했으나, 상세 수집 명령은 승인 단계에서 거절됐다.
- 이후 사용자가 **추가 호출 없이 여기까지 저장**을 선택했다. 추가 TechSpecs 호출은 실행하지 않았다.
- 따라서 현재 공개 스마트폰 목록이 비어 있는 것은 정상이다. 수집된 국내 정발 상세 제품이 아직 없다.
- 실제 데이터 파일과 SQLite DB는 `back/.local/`에 있으며 Git에서 제외한다.

## DB 연결

Supabase 설정이 있으면 기존 Supabase 연결을 사용한다.
Supabase 설정이 없는 로컬 개발에서는 Node.js 22의 SQLite로 아래 파일을 자동 생성한다.

```text
back/.local/device-catalog.sqlite
```

운영 환경(`NODE_ENV=production`)에서 Supabase가 없으면 자동 SQLite 대체를 하지 않는다.
로컬 SQLite를 추가한 것은 기기 카탈로그뿐이다. 기존 회원가입/견적 저장은 여전히 Supabase 설정이 필요하다.
공용 Supabase로 옮길 때는 SQL Editor에서 `back/src/data/device_catalog.sql`을 실행하고 서비스역할 키를 설정한다.
이번 작업에서는 실제 Supabase 프로젝트에 SQL을 실행하지 않았다.

```dotenv
TECHSPECS_API_ID=발급한_ID
TECHSPECS_API_KEY=발급한_KEY
TECHSPECS_STORAGE_ALLOWED=true
SUPABASE_URL=https://실제프로젝트.supabase.co
SUPABASE_SERVICE_KEY=실제_서비스역할_키
```

이 컴퓨터에서는 API 키를 이미 입력했다. 새 컴퓨터에는 `.env`가 자동으로 전달되지 않는다.
비밀값은 GitHub나 채팅에 올리지 않는다. 사용자는 데이터 저장 허가를 받았다고 확인했다.
환경변수를 바꿨다면 백엔드를 재시작한다.

## 실행

터미널 두 개에서 각각 실행한다.

```powershell
cd back
npm ci
npm start
```

```powershell
cd front
npm ci
npm run serve
```

카탈로그 주소: http://localhost:8080/devices

## 수집을 다시 진행하기로 했을 때

아래 명령은 **실제 API 호출량을 사용한다.** 현재 사용자는 추가 호출 중단을 선택했으므로 자동 실행하지 않는다.

```powershell
cd back
node scripts/syncDevices.js --category Smartphones --brand all --max-pages 1 --dry-run
node scripts/syncDevices.js --category Laptops --brand ASUS --max-pages 1 --apply
```

- 기본값은 Smartphones, 전체 브랜드, 페이지 크기 10, 최대 1페이지, dry-run이다.
- `--category all`은 지원하는 7개 분류를 처리한다. `--query`로 제품명을 지정할 수 있다.
- `--apply`는 검색된 제품마다 상세를 추가 조회하고 DB에 upsert한다.
- `--start-page`로 다음 수집 구간을 지정한다. `--max-pages`는 최대 10이다.
- 스마트폰/태블릿/스마트워치의 기간은 서버가 자동 적용한다. 날짜/연도 CLI 옵션은 없다.
- 같은 제공사 ID는 갱신하고, 다른 ID의 지역·옵션 제품은 유지한다.
- 인증/호출 한도/DB 오류는 즉시 중단하고 저장 완료 개수를 보고한다.

실제 검색 결과에서 ID를 확보한 경우에는 최대 10개를 명시적으로 가져올 수도 있다.

```powershell
node scripts/importDeviceIds.js 실제제품ID
```

스마트폰 국내 정발 검수 후 근거를 저장하는 명령:

```powershell
node scripts/reviewDomesticDevice.js 실제제품ID https://제조사공식한국모델페이지
```

근거 URL은 사람이 해당 모델과 일치하는지 검토해야 한다. 위 명령이 URL 내용을 자동 검증하는 것은 아니다.
가져오기 작업은 기존의 정발 검수 상태를 덮어쓰지 않는다.
초기에 확인한 국내 갤럭시 모델의 공식 근거 후보:
https://www.samsungsvc.co.kr/solution/1848050

## API 및 테스트

- `GET /api/v1/devices/meta?category=Smartphones`: 지원 분류와 DB에서 계산한 브랜드 목록.
- `GET /api/v1/devices/products`: DB 검색. 기기 종류/브랜드/검색어/페이지만 받는다.
- `GET /api/v1/devices/products/:id`: 공개 조건을 만족하는 DB 상세.
- `POST /api/v1/devices/import`: 관리자 전용 페이지 수집.
- `PATCH /api/v1/devices/products/:id/domestic-availability`: 관리자 전용 국내 정발 검수.
- 방문자가 source/years/from 같은 값을 보내도 자동 정책을 변경하거나 제공사 API를 직접 호출하지 않는다.

```powershell
cd back
npm run test:devices
```

가상 제품과 실제 SQLite를 사용하는 19개 테스트가 통과했다.
프론트엔드는 `npm run build`로 확인한다. 기존 CSS 최소화/번들 크기 경고는 남아 있다.
Supabase 경로는 실제 DB 설정이 없어 통합 검증하지 못했다.
대여 재고·예약·반납 기능 및 전체 제품 수집은 미구현/미완료 상태다.

## 공식 문서

- https://techspecs.readme.io/reference/getting-started-with-your-api-1
- https://techspecs.readme.io/reference/product-search-get-all-products
- https://techspecs.readme.io/reference/product-detail
- https://techspecs.readme.io/reference/database-information

v5 인증에는 x-api-id, x-api-key 헤더를 사용한다. 이미지 응답에는 별도 이용 권한이 필요하다는 안내가 있어 실제 이미지는 아직 확보하지 않았다.
