@echo off
echo Inicializando Git Staging Flow...

:: Initialize Git (Using standard path)
"C:\Program Files\Git\cmd\git.exe" init

:: Configure User (Standard placeholder, user should update)
"C:\Program Files\Git\cmd\git.exe" config user.email "admin@tienda.com"
"C:\Program Files\Git\cmd\git.exe" config user.name "Admin Tienda"

:: Ignore node_modules if not ignored
if not exist .gitignore echo node_modules/ > .gitignore
if not exist .gitignore echo .env >> .gitignore
if not exist .gitignore echo .env.* >> .gitignore
if not exist .gitignore echo !.env.example >> .gitignore

:: Add all files
"C:\Program Files\Git\cmd\git.exe" add .

:: Initial Commit
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial commit: Production setup"

:: Create Main Branch
"C:\Program Files\Git\cmd\git.exe" branch -M main

:: Create Staging Branch
"C:\Program Files\Git\cmd\git.exe" checkout -b staging

echo.
echo ==========================================
echo Git Flow Configurado Exitosamente!
echo ==========================================
echo Rama Actual: staging
echo.
echo Pasos Siguientes:
echo 1. Sube tu codigo a GitHub:
echo    git remote add origin URL_DE_TU_REPO
echo    git push -u origin main
echo    git push -u origin staging
echo.
pause
