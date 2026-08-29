@echo off
setlocal
set "RAIZ=%~dp0"

echo ============================================
echo   Smart HAS - subindo backend + web + mobile
echo ============================================
echo.

echo [1/3] Backend (Spring Boot + Firebase) - porta 8080
start "Smart HAS - Backend" "%RAIZ%.launchers\run_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/3] Painel Web (Angular) - porta 4200
start "Smart HAS - Painel Web" "%RAIZ%.launchers\run_web.bat"

timeout /t 3 /nobreak >nul

echo [3/3] App Mobile (React Native / Expo web)
start "Smart HAS - App Mobile" "%RAIZ%.launchers\run_mobile.bat"

echo.
echo Tudo iniciado em janelas separadas. Aguarde o backend
echo terminar de subir (uns 15-30s na primeira vez) antes de
echo usar o painel/app.
echo.
echo   Backend:   http://localhost:8080
echo   Swagger:   http://localhost:8080/swagger-ui/index.html
echo   Painel:    http://localhost:4200
echo   Login admin: admin@smarthas.com / admin123
echo.
echo Feche as janelas abertas para parar cada servico.
echo.
pause
