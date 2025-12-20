@echo off
echo Conectando con GitHub...

:: Define path to Git
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"

:: Push Main
echo Subiendo rama MAIN...
%GIT_PATH% push -u origin main

:: Push Staging
echo Subiendo rama STAGING...
%GIT_PATH% push -u origin staging

echo.
echo ==========================================
echo Si te pidio iniciar sesion, todo salio bien.
echo Revisa tu repositorio en GitHub para ver los archivos.
echo ==========================================
pause
