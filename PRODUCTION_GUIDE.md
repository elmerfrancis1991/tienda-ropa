# Guía de Flujo de Trabajo y Despliegue

Tu sistema ahora utiliza un flujo profesional para asegurar que los cambios sean probados antes de llegar a tus clientes.

## 🚀 El Ciclo de Despliegue

### 1. Desarrollo y Pruebas (Staging)
Cada vez que hagamos una mejora, se subirá primero a la rama `staging`.
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

## 🛠️ Seguimiento en GitHub Actions
Puedes monitorear el progreso de cada subida en la pestaña **"Actions"** de tu repositorio:
- **Deploy Staging**: Se activa al subir a la rama `staging`.
- **Deploy Production**: Se activa al subir a la rama `main`.
