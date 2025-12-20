# Guía de Flujo de Trabajo y Despliegue

Tu sistema ahora utiliza un flujo profesional para asegurar que los cambios sean probados antes de llegar a tus clientes.

## 🚀 El Ciclo de Despliegue

### 1. Identificar y Registrar Mejoras (NUEVO)
Antes de subir cualquier cambio, es vital anotar qué se mejoró para llevar un control profesional.
- Abre el archivo `CHANGELOG.md`.
- Sigue el formato existente: añade la fecha, la versión y una lista de lo que hiciste (ej: "Se arregló el botón X").
- Actualiza también la versión en `package.json` (ej: de `1.1.0` a `1.2.0`).

### 2. Desarrollo y Pruebas (Staging)
Una vez anotado el cambio, se sube primero a la rama `staging`.
- **URL de Pruebas**: [https://tienda-ropa-staging-demo.web.app/](https://tienda-ropa-staging-demo.web.app/)
- **Acción**: Aquí es donde tú entras, pruebas los botones, realizas ventas ficticias y validas que todo esté como te gusta.

### 2. Validación y Pase a Producción
Una vez que me digas "Listo, ya probé en staging y funciona", pasaremos los cambios a la rama `main`.
- **Acción**: Yo (o tú vía Git) realizaré el "Merge" de staging a main.
- **Resultado**: La URL oficial se actualizará automáticamente.

---

## 🏷️ Control de Versiones (Esquina Superior Derecha)

Llevamos el control en el archivo `package.json`. Sigue este estándar para que siempre sepas qué tienes instalado:

1. **Para Pruebas (Staging)**: 
   - Usa el sufijo `-rc` (Release Candidate). 
   - Ejemplo: `"version": "1.1.0-rc.1"`
   
2. **Para Oficial (Producción)**: 
   - Usa el número limpio una vez que la prueba sea exitosa.
   - Ejemplo: `"version": "1.1.0"`

### Cómo cambiar la versión:
1. Abre el archivo `package.json`.
2. En la línea 4, cambia el número: `"version": "1.1.0-rc.1"`.
3. Guarda y sube el cambio a GitHub.

---

## � Manual de Comandos (Cómo subir cambios)

Aquí tienes los "hechizos" mágicos que debes escribir en tu terminal para gestionar el sistema:

### Caso A: Subir mejoras a STAGING (Para probar)
Usa esto cuando hayas terminado un cambio y quieras verlo en la web de pruebas:
```powershell
# 1. Guardar tus cambios localmente
git add .
git commit -m "Descripción de lo que hiciste (ej: cambio de versión)"

# 2. Subirlo a la nube de pruebas
git push origin staging
```

### Caso B: Pasar de STAGING a PRODUCCIÓN (Cuando ya probaste)
Usa esto cuando lo que viste en el link de pruebas te encantó y quieres que tus clientes lo vean:
```powershell
# 1. Cambiarse a la rama principal
git checkout main

# 2. Traer los cambios aprobados desde staging
git merge staging

# 3. Subir a la web oficial
git push origin main

# 4. Volver a staging para seguir trabajando
git checkout staging
```

> [!TIP]
> **¿Dónde escribo esto?** En tu editor de código (VS Code), abre una **Terminal** (Ctrl+ñ) y pega los comandos uno por uno.
