# 학교 및 새 컴퓨터 셋업

Windows PowerShell 기준. 아래 예시는 프로젝트 경로를 `C:\pc-fit-main`으로 통일합니다. 다른 경로를 쓰면 명령의 경로도 바꿉니다.

## 1. 지금 컴퓨터에서 먼저 준비

본인 저장소는 https://github.com/SeongYoungOwn/pc-fit.git 이며 작업 브랜치는 main입니다. 학교에서 받기 전에 GitHub의 최신 커밋이 이 컴퓨터의 커밋과 같은지 확인합니다.

```powershell
cd C:\pc-fit-main
git status --short
git log -1 --oneline
git remote -v
```

소스와 문서는 Git으로 옮기고, 아래 로컬 설정·DB는 따로 준비합니다. node_modules와 front/dist는 학교에서 다시 생성합니다.

### DB와 설정을 같이 가져갈지 선택

| 자료 | Git 포함 | 학교 복원 방식 |
| --- | --- | --- |
| 소스·공식 제조사 사양 파일·문서 | 커밋하면 포함 | clone/pull |
| `back/.env` | 제외 | 개인 경로로 안전하게 전달하거나 필요한 값을 직접 설정 |
| `back/.local/official-catalog.sqlite` | 제외 | 소스에 있는 제조사 자료로 자동 초기화 |
| `back/.local/parts-catalog.sqlite` | 제외 | 무료 다운로드·import 또는 기존 DB 전달 |
| `back/.local/device-catalog.sqlite` | 제외 | 기존 TechSpecs 수집분 유지 시 별도 전달 필요 |

같은 제품 상태를 옮기려면 **백엔드를 정상 종료한 뒤** 필요한 SQLite 파일을 복사합니다. `-wal`/`-shm` 파일이 남아 있다면 원본 DB와 함께 보관합니다. 새 컴퓨터 서버를 종료한 상태에서 `back/.local/`에 복원합니다. 기존 학교 DB가 있으면 먼저 백업하며 덮어쓰지 않습니다. 라이선스가 있는 수집 데이터는 공개 저장소에 올리지 않습니다.

## 2. 학교 PC에 Git과 Node.js 준비

검증에 사용한 버전은 Node.js **22.17.0**입니다. `node:sqlite`를 지원하는 Node 22 환경을 준비하고 다음을 확인합니다.

```powershell
git --version
node --version
npm.cmd --version
node -e "require('node:sqlite'); console.log('SQLite OK')"
```

SQLite 실험 기능 경고 자체는 실패가 아닙니다. 명령을 찾을 수 없다면 설치 후 터미널을 다시 엽니다. 학교 설치 권한이 없다면 관리자에게 개발 도구 설치를 요청합니다.

## 3. 저장소 받기

`C:\pc-fit-main`이 없는 새 컴퓨터에서 실행합니다.

```powershell
cd C:\
git clone https://github.com/SeongYoungOwn/pc-fit.git pc-fit-main
cd C:\pc-fit-main
git log -1 --oneline
```

다른 브랜치로 push했다면 `git switch 브랜치이름`을 실행합니다. 비공개 저장소면 본인 GitHub 계정으로 인증합니다. Download ZIP도 실행은 가능하지만 이후 pull/push로 이어가기 위해서는 clone이 편합니다.

이미 clone한 컴퓨터에서는 아래처럼 작업 파일을 확인한 후 업데이트합니다. 수정 파일이 있으면 먼저 보존하고 충돌을 해결합니다.

```powershell
cd C:\pc-fit-main
git status --short
git pull --ff-only
```

## 4. 백엔드 설치와 환경설정

```powershell
cd C:\pc-fit-main\back
npm.cmd ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
notepad .env
```

실제 키는 `.env.example`이 아닌 `.env`에만 입력합니다. 카탈로그 개발의 기본값은 다음과 같습니다. `SESSION_SECRET`은 직접 만든 임의의 긴 값으로 설정합니다.

```dotenv
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:8080
```

- 공식 기기와 무료 PC 부품 검색은 TechSpecs/AI 키 없이 사용할 수 있습니다.
- Supabase를 사용하지 않는다면 예시 URL/키를 그대로 두지 말고 해당 항목을 비워 둡니다. 회원·저장·게시판은 작동하지 않습니다.
- 기존 TechSpecs DB를 개인적으로 복원할 경우 기존 저장 허가에 맞게 `TECHSPECS_STORAGE_ALLOWED=true` 설정을 유지해야 공개 조회에 포함됩니다. 이 값만으로 유료 수집을 실행하는 것은 아닙니다.
- `PARTS_CATALOG_PATH`에 집 컴퓨터 전용 경로가 들어 있으면 비워서 기본 로컬 경로를 사용하거나 학교 경로로 수정합니다.
- Naver Cloud 쇼핑 인사이트 키는 상품 가격 검색용 키가 아닙니다. 현재 기기 화면은 네이버 검색 링크를 제공합니다.

## 5. PC 부품 DB 복원

개인적으로 기존 `parts-catalog.sqlite`를 복사했다면 이 다운로드 단계는 생략할 수 있습니다. 새로 구성하는 경우:

```powershell
cd C:\pc-fit-main\back
npm.cmd run sync:parts
```

무료 BuildCores 자료를 내려받아 SQLite로 등록합니다. 네트워크·`tar` 명령이 필요하고 최신 원본을 받으므로 기존 집계 수량과 다를 수 있습니다. 코드 clone만으로 이 DB가 생기지는 않습니다. 학교 네트워크에서 차단되면 정상 종료 후 준비한 DB를 복원합니다.

이 PC에서 이미 원본 다운로드를 마쳤다면 `npm.cmd run import:parts`로 재등록할 수 있습니다. 다른 PC에서 원본 폴더만 복사한 경우에는 다운로드 메타데이터의 절대 경로가 달라질 수 있으므로 SQLite 전달 또는 새 다운로드를 권장합니다.

`npm run sync:devices`는 TechSpecs 수집 명령이므로 기본 셋업에서는 실행하지 않습니다.

## 6. 터미널 두 개로 실행

첫 번째 터미널:

```powershell
cd C:\pc-fit-main\back
npm.cmd start
```

두 번째 터미널:

```powershell
cd C:\pc-fit-main\front
npm.cmd ci
npm.cmd run serve
```

브라우저에서 [IT 기기](http://localhost:8080/devices), [기기 비교](http://localhost:8080/devices/compare), [PC 부품](http://localhost:8080/parts)을 엽니다. 실행 터미널은 열어 두고 종료 시 각각 `Ctrl+C`를 누릅니다. 다음 실행부터는 의존성이 바뀌지 않았다면 `npm ci`를 반복할 필요가 없습니다.

## 7. 확인과 문제 해결

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

`status: ok`를 확인한 뒤 기기 목록, Samsung 브랜드 필터, 같은 품목 2개 비교, PC 부품 검색을 점검합니다. 추가 점검은 [검증 안내](TESTING.md)를 따릅니다.

| 증상 | 확인할 내용 |
| --- | --- |
| `npm.ps1` 실행 정책 오류 | 이 문서처럼 `npm.cmd` 사용 |
| `node:sqlite` 오류 | Node 버전 및 SQLite 확인 명령 |
| 프론트 프록시 연결 실패 | 백엔드 3000 포트 실행 여부 |
| `EADDRINUSE` | 기존 동일 서버를 정상 종료하거나 포트 점유 프로그램 확인 |
| PC 부품 목록 없음 | DB 전달 또는 `sync:parts` 완료 여부 |
| 집보다 스마트폰이 3개 적음 | Git 제외된 TechSpecs DB 및 저장 허가 설정 확인 |
| 회원 기능 503 | Supabase 미설정 상태인지 확인 |
| 다나와 후보 없음 | 네트워크·외부 사이트 응답·상품 매칭 조건 확인; 임의 가격 입력 금지 |

## 8. 다음 대화에서 이어갈 설명

> C:\pc-fit-main의 docs/README.md, docs/PROJECT_STATUS.md, docs/DEVELOPMENT_LOG.md를 읽고 현재 git diff와 실행 환경을 확인해 주세요. PC 견적을 유지하면서 국내 최근 5년 스마트폰·노트북·태블릿·스마트워치 검색/비교를 개발 중입니다. PC 부품은 /parts로 분리했습니다. TechSpecs 추가 유료 호출은 하지 않고, 실제 가격 이력과 대여 기능은 미완료입니다. 완료됐다고 단정하기 전에 현재 환경에서 검증해 주세요.

작업을 마치면 변경 소스·문서를 검토해 본인 브랜치에 커밋·push하고, 새로 생긴 로컬 DB 변경은 별도로 보관합니다. 공용 PC에는 사용 후 개인 키와 로그인 세션을 남기지 않습니다.
