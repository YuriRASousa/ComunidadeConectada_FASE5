@echo off
title Smart HAS - App Mobile
cd /d "%~dp0..\mobile-react-native\SmartHASApp"
call npx expo start --web
echo.
echo (o app mobile parou / fechou - pressione uma tecla para fechar esta janela)
pause >nul
