# Historial de Mejoras (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.2.0-rc.1] - 2025-12-20
### Agregado
- Indicador de versión en la esquina superior derecha del Dashboard.
- Guía de comandos Git en `PRODUCTION_GUIDE.md`.
- Este archivo `CHANGELOG.md` para seguimiento de mejoras.

### 🛡️ Seguridad
- El botón "Poblar Datos" ahora se oculta automáticamente en producción para proteger el acceso administrativo.

### ⚙️ Mejoras Técnicas
- Inyección de credenciales de Firebase como fallback (reparación de pantalla negra).
- Actualización de Node.js a la versión 20 en GitHub Actions.

## [1.1.0] - 2025-12-20
### Agregado
- Soporte para pagos vía **Transferencia** en el Punto de Venta.
- Resumen de transferencias en el Cierre de Caja.
- Filtros inteligentes en el Historial de Facturas (Hoy, Semana, Mes).

### Corregido
- Navegación fluida en el Dashboard (cambio de `<a>` por `<Link>`).
- Error de tipos en el componente de Cierre de Caja.

## [1.0.0] - Lanzamiento Inicial
- Sistema base de POS, Inventario y Reportes.
