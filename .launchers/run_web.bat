@echo off
title Smart HAS - Painel Web
cd /d "%~dp0..\web\smarthas-admin"
call npx ng serve
echo.
echo (o painel web parou / fechou - pressione uma tecla para fechar esta janela)
pause >nul
