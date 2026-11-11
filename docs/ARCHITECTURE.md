# 시스템 구조

## 실행 구성

```text
브라우저 :8080
  └─ Vue 3 / Vue Router / Vuex / Vuetify
      └─ /api 프록시 → Express :3000
          ├─ 공식 제조사 사양 파일 → SQLite 제품 목록
          ├─ 기존 TechSpecs 저장분 → 제품 조회 병합
          ├─ BuildCores SQLite → PC 부품 및 견적
          ├─ danawa-cli → 외부 판매 후보 (네트워크 필요)
          └─ Supabase / AI → 설정한 기능에서만 사용
```

## 코드 위치

| 경로 | 역할 |
| --- | --- |
| `front/src/views` | 기기 목록·비교·가격 및 기존 견적 화면 |
| `front/src/router` | `/devices`와 `/parts` 분리 및 이전 링크 이동 |
| `front/src/services/api.js` | 백엔드 요청 |
| `front/vue.config.js` | 개발 서버 8080 및 3000 프록시 |
| `back/bin/www` | 환경설정 로드, HTTP/Socket.IO 서버 실행 |
| `back/src/routes/deviceRoutes.js` | 제품·비교·가격 후보 API |
| `back/src/services/catalogFacade.js` | IT 기기와 PC 부품 공급처 구분 |
| `back/src/services/officialCatalogRepository.js` | 공식 자료 초기화 및 기존 수집분 조회 병합 |
| `back/src/services/deviceCatalogPolicy.js` | 출시 기간 및 국내 공개 조건 |
| `back/src/services/deviceComparison.js` | 사양 비교 데이터 구성 |
| `back/src/data` | 제조사 사양 스냅샷·국내 근거·검수값 |
| `back/scripts` | 수집·부품 import·검증 명령 |

## 저장소 분리

`back/.local/official-catalog.sqlite`는 코드의 제조사 자료로 초기화합니다. `device-catalog.sqlite`는 기존 TechSpecs 수집분, `parts-catalog.sqlite`는 무료 PC 원본 자료입니다. 세 DB는 Git 제외 대상이며 배포 서버로 자동 전송되지 않습니다.

제품 목록과 비교는 사전 등록된 DB를 읽습니다. 검색할 때마다 유료 제품 상세를 가져오지 않습니다. 가격 후보는 별도의 외부 요청이며 실제 과거 가격 시계열 저장과는 구분합니다.

Supabase 회원·게시판 데이터는 위 제품 SQLite와 별개입니다. 정확한 테이블·마이그레이션 상태를 확인하지 않은 상태에서 전체 ERD가 완성됐다고 간주하지 않습니다.
