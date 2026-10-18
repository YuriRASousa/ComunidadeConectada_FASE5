@echo off
REM Abre a demonstracao da Fase 7 para o video. Cada passo espera Enter.
chcp 65001 >nul
cd /d "%~dp0"
python demo_fase7.py
pause
