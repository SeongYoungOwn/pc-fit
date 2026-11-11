# 검증 안내

## 자동 점검

백엔드:

```powershell
cd C:\pc-fit-main\back
npm.cmd test
```

프론트엔드:

```powershell
cd C:\pc-fit-main\front
node --experimental-test-isolation=none --test test/*.test.mjs
npm.cmd run build
```

제품 DB와 서버를 복원한 환경에서는 `back/scripts/verifyCatalog.js`, `verifyBuilds.js`, `verifyApp.js`의 실행 조건을 확인한 후 점검할 수 있습니다. 전체 테스트 통과가 외부 API·회원·대여 기능 완료를 의미하지 않습니다.

## 수동 점검

1. `/devices`에서 네 품목을 바꾸며 실제 목록과 상세를 확인합니다.
2. `/devices/compare`에서 Samsung 선택 후 타사 제품이 남지 않는지 확인합니다. 브랜드를 빠르게 바꿔도 이전 요청 결과가 덮어쓰면 안 됩니다.
3. 같은 품목 2개를 비교하고 출처·단위·누락 표기를 확인합니다.
4. 이전 CPU 기기 링크가 `/parts`로 이동하고 부품 상세가 열리는지 확인합니다.
5. 가격 후보 버튼의 제품명·용량·판매 조건을 확인합니다. 외부 응답 실패와 데이터 없음도 정상 안내해야 합니다.
6. 실제 가격 이력이 없으면 예시 차트임이 표시되는지 확인합니다.
7. PC 견적 생성과 부품 교체 후 호환성·추정 합계 갱신을 확인합니다.

## 기존 점검 기록

마지막 구현 기록에는 백엔드 및 화면 응답 순서 테스트 43개 통과, 프론트 빌드 성공, 네 품목 API 조회·비교, 삼성/ASUS 비교표, 다나와 S24 후보 5건이 기록돼 있습니다. 자세한 이력은 [개발일지](DEVELOPMENT_LOG.md)에 있습니다.

이번 공식 판매처 변경에서는 백엔드 43개·프론트 8개 테스트와 프로덕션 빌드가 통과했습니다. 실제 브라우저에서 iPhone 17의 Apple 구매 주소 및 통신사 홈 안내, Galaxy S24의 SKT 구매 주소 및 다른 판매처 홈 안내를 확인했습니다. 빌드의 기존 Vuetify CSS 압축·번들 크기·Browserslist 경고는 남아 있습니다. 새 컴퓨터 셋업과 모든 외부 상품 재고를 검증한 것은 아닙니다. 이전 [2026-11-07 QA 기록](archive/QA_REPORT.md)은 당시 결과이며 최신 데이터 수량과 다릅니다.

Windows 제한 환경에서 테스트 하위 프로세스가 spawn EPERM으로 차단되면 백엔드에서도 `node --experimental-test-isolation=none --test`로 실행할 수 있습니다.
