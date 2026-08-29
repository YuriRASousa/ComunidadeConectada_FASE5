@echo off
title Smart HAS - Backend
cd /d "%~dp0..\backend\smarthas-api"
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
call .\mvnw.cmd spring-boot:run
echo.
echo (o backend parou / fechou - pressione uma tecla para fechar esta janela)
pause >nul
