# PC-FIT

**PC 견적부터 국내 IT 기기 검색·사양 비교·구매처 확인까지 제공하는 전공심화 졸업프로젝트입니다.**

사용자가 예산과 용도에 맞는 PC를 구성하고, 스마트폰·노트북·태블릿·스마트워치를 비교해 선택할 수 있도록 개발하고 있습니다. 기기 대여는 향후 구현 범위입니다.

[학교·새 컴퓨터 셋업](docs/SCHOOL_SETUP.md) · [전체 문서](docs/README.md) · [단계별 개발일지](docs/DEVELOPMENT_LOG.md) · [현재 구현 상태](docs/PROJECT_STATUS.md)

## 주요 기능

| 기능 | 구현 내용 |
| --- | --- |
| PC 견적 | 실제 부품 DB 기반 추천, 직접 검색·교체, 전력 및 기본 호환성 확인 |
| IT 기기 탐색 | 국내 출시 근거가 있는 최근 5년 제품 목록, 품목·브랜드·제품명 검색 |
| 사양 비교 | 같은 품목 최대 3개 비교, 차이점 표시, 공유 URL |
| 상세 사양 | 한국어 항목명과 사양 그룹, 단위·원본 출처 표시 |
| 판매 가격 후보 | 비공식 danawa-cli를 통한 검색 결과와 판매 페이지 이동 |
| 공식 판매처 | 확인된 제품은 구매 페이지로 연결, 미확인 제품은 버튼 아래 안내와 함께 공식몰 홈으로 연결 |
| 가격 변동 화면 | 기간 선택 및 명시적인 예시 차트 제공. 실제 가격 이력은 아직 미연결 |

PC 부품과 IT 기기는 별도 화면에서 탐색합니다. 카탈로그는 사전 등록 DB를 읽으므로 사용자가 검색하기 전에 제품 목록을 볼 수 있습니다.

## 화면 구성

| 주소 | 화면 |
| --- | --- |
| / | 홈 |
| /builder | PC 견적 구성 |
| /parts | PC 부품·주변기기 탐색 |
| /devices | 스마트폰·노트북·태블릿·스마트워치 탐색 및 상세 |
| /devices/compare | 기기 사양 비교 |
| /devices/prices | 판매 가격 후보 및 가격 이력 화면 |

## 기술 구성

- 프론트엔드: Vue 3, Vue Router, Vuex, Vuetify, Axios
- 백엔드: Node.js, Express
- 제품 저장소: SQLite — 공식 기기·PC 부품·TechSpecs 수집분을 분리
- 회원·저장·게시판: Supabase 설정 필요
- 데이터 수집: 제조사 공식 사양 자료, BuildCores 공개 데이터, 기존 TechSpecs 수집분

## 빠른 실행

Windows PowerShell, Git과 **Node.js 22.17.0** 기준입니다. 다른 환경 및 DB 이전 방법은 [상세 셋업](docs/SCHOOL_SETUP.md)을 확인하세요.

처음 받는 컴퓨터:

```powershell
cd C:\
git clone https://github.com/SeongYoungOwn/pc-fit.git pc-fit-main
cd C:\pc-fit-main\back
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

back/.env에서 SESSION_SECRET을 직접 설정합니다. 사용하지 않는 Supabase 예제 URL·키는 비워 두세요. 기본 포트는 백엔드 3000, 프론트엔드 8080입니다. API 키는 .env.example에 입력하지 않습니다.

집과 같은 부품 목록이 필요하면 집의 `parts-catalog.sqlite` 백업을 `back/.local/`에 넣습니다. 백업이 없을 때만 `npm.cmd run sync:parts`로 다시 구성합니다. 공식 IT 기기 DB는 저장소 자료로 초기화됩니다. 두 DB로 실행할 때는 `.env.example`의 `TECHSPECS_STORAGE_ALLOWED=false` 설정을 사용합니다. 파일 복사와 확인 방법은 [학교 셋업](docs/SCHOOL_SETUP.md)을 참고하세요.

PC 부품 DB를 준비했으면 백엔드를 실행합니다.

```powershell
npm.cmd start
```

별도 터미널에서 프론트엔드를 실행합니다.

```powershell
cd C:\pc-fit-main\front
npm.cmd ci
npm.cmd run serve
```

[로컬 사이트](http://localhost:8080/devices)를 엽니다. 공식 기기 자료는 서버에서 자동 초기화합니다. TechSpecs 유료 수집 명령인 sync:devices는 기본 셋업에 필요하지 않습니다.

이미 받은 학교 컴퓨터에서는 수정 파일을 먼저 보존하고 다음으로 최신 코드를 받습니다.

```powershell
cd C:\pc-fit-main
git status --short
git pull --ff-only
```

의존성이 변경됐다면 back과 front에서 npm.cmd ci를 다시 실행합니다. **.env와 back/.local의 SQLite DB는 Git에 포함되지 않으므로 별도 설정·복원이 필요합니다.**

## 데이터와 현재 범위

- 네 가지 IT 품목에 국내 출시 근거와 자동 최근 5년 조건을 적용합니다. 국내 전체 제품·세부 용량·색상 SKU를 모두 확보한 상태는 아닙니다.
- 마지막 로컬 공개 집계는 스마트폰 18개, 노트북 22개, 태블릿 14개, 스마트워치 5개입니다. 스마트폰 중 TechSpecs 3개는 로컬 DB를 별도로 옮겨야 합니다.
- PC 원본은 수집 당시 47,436개·23종의 글로벌 데이터입니다. 모든 부품의 국내 판매 여부가 확인됐다는 의미는 아닙니다. BuildCores의 CC BY-NC-SA 4.0 출처·라이선스를 유지합니다.
- 다나와는 공식 제휴 API가 아닌 danawa-cli 검색입니다. 용량·자급제·통신사 조건이 다를 수 있어 결과를 동일 조건의 확정 최저가로 표시하지 않습니다.
- 네이버는 쇼핑 검색 이동 링크를 제공합니다. 상품 가격 API 연결 완료 상태가 아닙니다. 쿠팡 API는 미연결입니다.
- 공식 판매처의 제품별 주소는 수동 검수하며 실시간 재고를 판정하지 않습니다. 현재 확인된 5개 주소와 홈 연결 정책은 [공식 판매처 문서](docs/OFFICIAL_STORES.md)에 있습니다.
- 견적 가격·FPS에는 추정치가 포함됩니다. 실제 가격 이력, 대여 재고·예약·반납·결제는 미구현이며 회원·저장·게시판은 Supabase 설정 후 검증이 필요합니다.

## 검증

```powershell
cd C:\pc-fit-main\back
node --experimental-test-isolation=none --test
cd C:\pc-fit-main\front
node --experimental-test-isolation=none --test test/*.test.mjs
npm.cmd run build
```

최근 기능 변경에서 백엔드 43개·프론트 8개 테스트와 프로덕션 빌드를 통과했습니다. 브라우저에서 공식 제품 주소 및 홈 안내를 확인했습니다. 빌드의 기존 CSS 압축·번들 크기·Browserslist 경고는 남아 있습니다. 상세 범위는 [검증 안내](docs/TESTING.md)를 확인하세요.

## 저장소 구조와 문서

```text
back/           Express API, 수집 스크립트, 공식 사양, 테스트
front/          Vue 화면, 공통 컴포넌트, 테스트
docs/           현황·설계·데이터·검증·셋업·단계별 개발일지
docs/archive/   과거 기획 및 구현 기록
기존 문서/      기존 발표 HTML·PPTX
tools/ponytail/ 개발 규칙의 원본 라이선스
```

[아키텍처](docs/ARCHITECTURE.md) · [제품 API](docs/API.md) · [국내 기기 데이터](docs/CATALOG_DATA.md) · [PC 부품 출처](docs/DATA_SOURCES.md)

개발 규칙은 루트 AGENTS.md에 정리했습니다. Ponytail 지침과 라이선스를 반영한 것이며 별도 플러그인 런타임이나 자동 훅 설치를 의미하지 않습니다.
