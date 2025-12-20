# Guía de Despliegue a Producción (Vía GitHub)

¡Tienes razón! Tu sistema ya está configurado para desplegarse automáticamente a través de **GitHub Actions**. Esto significa que no necesitas compilar manualmente en tu computadora; GitHub lo hará por ti.

## Pasos para subir a Producción

### 1. Preparar los archivos
Asegúrate de que los cambios que hemos hecho (navegación, caja con transferencias, filtros) funcionen como esperas en el ambiente de Staging.

### 2. Configurar Producción (Si aún no está hecho)
GitHub necesita saber a qué base de datos conectarse para "Producción". Debes tener un archivo `.env.production` con las credenciales finales. 
> [!IMPORTANT]
> Si el archivo `.env.production` no existe en tu repositorio, créalo siguiendo el formato de `.env.staging` pero con los datos de tu proyecto de Firebase Real/Producción.

### 3. Subir cambios a la rama `main`
Cuando estés listo para que el mundo vea la nueva versión:
1. Asegúrate de estar en la rama `main` (o haz un "Merge" desde tu rama de desarrollo a `main`).
2. Sube los cambios (Push) a GitHub.

### 4. Seguimiento Automático
1. Ve a la pestaña **"Actions"** en tu repositorio de GitHub.
2. Verás un proceso llamado **"Deploy Production"** ejecutándose.
3. Una vez termine (se ponga en verde), tu página web se actualizará sola en la URL de producción.

## Verificación Final
1. Entra a tu URL de producción oficial.
2. Abre una caja, realiza una venta y verifica que el historial de facturas ahora filtre correctamente por Hoy/Semana/Mes.
3. ¡Disfruta de tu sistema actualizado!
