@echo off
REM Abre a demonstracao do banco para o video. Cada consulta espera Enter.
chcp 65001 >nul
cd /d "%~dp0"
python demo_consultas.py
pause
