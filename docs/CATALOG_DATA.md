# 국내 IT 기기 카탈로그 — 2026-11-10

## 공개 기준

- 스마트폰·노트북·태블릿·스마트워치: 서울 날짜 기준 최근 **5년**, 국내 정식 출시/판매 근거가 있는 제품.
- 국내 출시 기록과 현재 재고는 다르다. 판매 후보의 용량·배송비·가입 조건은 판매 페이지에서 확인한다.
- 국내 전체 시장을 망라한 DB는 아니다. 모델군 단위와 정확한 판매 SKU 단위가 섞여 있으므로, 옵션은 나열하고 단일 구성처럼 표시하지 않는다.
- 연도만 확인되면 해당 연도 전체가 범위 안에 들어오는 경우만 공개한다. 경계 연도·올해 제품은 정확한 출시일 검수 전 누락될 수 있다.

## 실제 구조

1. `back/scripts/collectOfficialDevices.js`로 공식 Apple 사양 페이지를 사전 수집한다. 캐시를 재처리하는 `--offline`, 다시 수집하는 `--refresh`를 지원한다.
2. `back/src/data/officialDevices.json`에 기본 사양, 공식 이미지 URL, 출처, 날짜 정밀도를 저장한다.
3. `reviewedOfficialDevices.js`와 `koreanDeviceFacts.js`에 삼성·LG·ASUS 공식 자료에서 검수한 수치를 관리한다.
4. 서버 시작 시 `back/.local/official-catalog.sqlite`에 저장한다. 공개 검색·비교는 이 데이터와 기존 로컬 TechSpecs 자료를 사용하며 유료 API를 호출하지 않는다.
5. 새로운 자료 파일에 없는 오래된 스냅샷 행은 공개 대상에서 제외한다. 기존 PC 부품 DB는 별도로 유지한다.

## 주요 근거

- Apple 한국 지원: [iPhone](https://support.apple.com/ko-kr/108044), [iPad](https://support.apple.com/ko-kr/108043), [MacBook Air](https://support.apple.com/ko-kr/102869), [MacBook Pro](https://support.apple.com/ko-kr/108052). 개별 제품에도 사양 페이지 주소 저장.
- [삼성 갤럭시 북4 국내 출시 및 사양표](https://news.samsung.com/kr/삼성전자-새로운-ai-경험과-터치-디스플레이의-갤럭시): 프로 14/16, 프로 360, 울트라. 사양표 이미지 직접 검수.
- [갤럭시 탭 S9](https://news.samsung.com/kr/삼성전자갤럭시-탭-s9-시리즈-공개), [탭 S10](https://news.samsung.com/kr/삼성전자-갤럭시-탭-s10-시리즈-공개): 국내 출시 일정과 사양표.
- [LG 그램 프로](https://www.lg.co.kr/media/release/27153): 16Z90SP / 17Z90SP / 16T90SP. RAM·저장 공간의 세부 SKU 검수는 아직 남아 있다.
- [ASUS 한국 제품 페이지](https://www.asus.com/kr/laptops/for-home/zenbook/asus-zenbook-14-oled-ux3405/): 국내 판매 모델 PP208W / PP720W / PZ293W. [상세 사양](https://www.asus.com/kr/laptops/for-home/zenbook/asus-zenbook-14-oled-ux3405/techspec/), [최초 발표](https://press.asus.com/news/press-releases/asus-zenbook-14-oled-ux3405-laptop-announced/). 제품군 발표일을 국내 SKU의 정확한 출시일로 단정하지 않는다.
- 사용자 제공 [laptops-specs-dataset](https://github.com/abhinavflac/laptops-specs-dataset): 인도 판매 제품과 루피 가격, 출시일 필드 없음. 국내 출시·5년 범위를 검증할 수 없어 공개 DB에 무검증 일괄 삽입하지 않았다.

## 사양과 사진의 한계

- 미확인 수치는 추정하지 않는다. 비교 대상 모두에서 미확인인 행은 생략하고 일부에서만 확인된 값은 미확인을 명시한다.
- 배터리 Wh와 mAh는 분리한다. 어댑터 정격 W를 배터리 충전 속도로 바꾸지 않는다. 실제 벤치마크가 없는 종합 점수는 만들지 않는다.
- 이미지 URL은 제조사 원본이다. 시리즈 공통 사진은 공통 사진임을 표시한다. LG 일부 제품 사진은 아직 미확보이며, 임의의 다른 제품 사진으로 대체하지 않았다.
- 일부 Apple 이전 주소는 오류/다국어 리디렉션으로 수집이 실패했다. 수집 명령에서 누락 URL이 보고되며, 국내 근거가 확인되지 않은 제품은 숨긴다.

## 가격 연결

- 다나와: `danawa-cli` 검색을 통한 판매 후보와 최저 표시 가격·상품 링크. 공식 제휴 API로 표현하지 않는다. 과거 가격 이력이나 모든 판매처 데이터는 확보하지 않았다.
- 네이버: [공식 종료 공지](https://developers.naver.com/notice/article/32530)에 따라 쇼핑 검색 API 종료를 안내하고 네이버 쇼핑 검색 링크를 제공한다.
- [NAVER API HUB 쇼핑 인사이트](https://api.ncloud-docs.com/docs/naver-api-hub-shopping-insight-categories)는 클릭 추이 데이터이며 상품 가격 API가 아니다. 클라우드 키를 종료된 검색 API에 보내지 않는다.
- 실제 테스트: 갤럭시 S24 국내 모델의 다나와 가격 후보 5건 반환. 가격 이력 차트는 아직 명시적인 예시 화면이다.

## 화면

- `/devices`: 네 가지 IT 기기만 탐색.
- `/parts`: PC 부품과 주변기기. 기존 CPU 상세 링크는 검색 조건과 제품 ID를 유지해 이 화면으로 이동.
- `/devices/compare`: 브랜드 선택 즉시 조회, 오래된 응답 무시, 사양별 공식 출처 링크.
- 디자인은 기존 밝은 기기 테마 유지. 기본색 `#2459D3`, 배경 `#F5F6F8`, 카드 `#FFFFFF`, 본문 `#182334`, 보조문자 `#647085`, 경계선 `#E3E8EF`. 홈은 수정하지 않았다.
