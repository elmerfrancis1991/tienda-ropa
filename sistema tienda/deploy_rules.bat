@echo off
chcp 65001 >nul
echo ==========================================
echo   Desplegando Reglas de Seguridad (POS)
echo ==========================================
echo.
echo 1. Verificando ubicación...
cd /d "%~dp0"
cd ..

echo.
echo 2. Buscando archivo de configuración...
if exist firebase.json (
    echo    [OK] firebase.json encontrado.
) else (
    echo    [ERROR] NO se encontró firebase.json en esta carpeta.
    pause
    exit /b
)

echo.
echo 3. Verificando herramientas...
call firebase --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] Instalando herramientas...
    call npm install -g firebase-tools
)

echo.
echo 4. Ejecutando despliegue...
call firebase deploy --only firestore:rules
if %ERRORLEVEL% EQU 0 goto success
goto error

:success
echo.
echo ==========================================
echo   ✅ DESPLIEGUE EXITOSO
echo   Las reglas de seguridad se han subido correctamente.
echo ==========================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul
exit /b

:error
echo.
echo ==========================================
echo   ❌ ERROR EN EL DESPLIEGUE
echo.
echo   Posibles causas:
echo   1. No has iniciado sesión (ejecuta 'firebase login')
echo   2. Tu internet está fallando
echo   3. No tienes permisos en el proyecto
echo ==========================================
echo.
pause
