@echo off
REM Sobe um servidor local e abre o jogo. Duplo clique para rodar.
cd /d "%~dp0"
echo Servindo em http://localhost:8000  (feche a janela para parar)
start "" http://localhost:8000
python -m http.server 8000
