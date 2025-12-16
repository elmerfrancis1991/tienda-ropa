@echo off
echo ==========================================
echo   Desplegando Reglas de Seguridad (POS)
echo ==========================================
echo.
echo Navegando a la carpeta del proyecto...
cd /d "%~dp0"

echo.
echo Ejecutando firebase deploy...
call firebase deploy --only firestore:rules

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    echo   ✅ DESPLIEGUE EXITOSO
) else (
    echo   ❌ ERROR EN EL DESPLIEGUE
    echo   Asegurate de haber instalado firebase-tools y de haber hecho login.
    echo   Comando: npm install -g firebase-tools
)
echo ==========================================
echo.
pause
