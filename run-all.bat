@echo off
TITLE PC-Fit Full Stack Runner
echo ==========================================
echo   PC-Fit Development Environment Starter
echo ==========================================
echo.

echo [1/2] 백엔드(Express) 서버 시작 중...
start "PC-Fit Backend" cmd /k "cd back && npm run dev"

echo [2/2] 프론트엔드(Vue 3) 서버 시작 중...
start "PC-Fit Frontend" cmd /k "cd front && npm run serve"

echo.
echo ------------------------------------------
echo 모든 서비스가 별도의 창에서 시작되었습니다.
echo 백엔드: http://localhost:3000
echo 프론트엔드: http://localhost:8080 (기본값)
echo ------------------------------------------
pause
