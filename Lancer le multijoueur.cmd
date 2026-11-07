@echo off
cd /d "%~dp0"
node scripts/start-game.mjs --online
if errorlevel 1 pause
