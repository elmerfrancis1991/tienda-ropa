# Historial de Mejoras (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.3.1] - 2025-12-28
### Agregado
- **Inventario:** Campo para configurar stock mínimo por producto.
- **Caja:** Vista detallada del historial de cierres con desglose de ventas.
- **Caja:** Funcionalidad para imprimir comprobante de cierre (Simulado).
- **Inventario:** Lógica de filtro "Stock Bajo" basada en el mínimo personalizado.

### Corregido
- **Sistema:** Actualizada fecha de sistema a 28 Dic 2025.
- **Facturación:** Eliminada visualización duplicada del ID de referencia.
- **UI:** Mejorada la visualización de diferencias positivas/negativas en el historial.

## [1.3.0] - 2025-12-28
### Agregado
- **POS:** Validación de límite de stock al agregar al carrito.
- **Caja:** Campo de observaciones obligatorio si hay faltante de dinero.
- **UI:** Alerta persistente cuando la caja está cerrada.
- **Inventario:** Creación dinámica de categorías desde el formulario.

### Corregido
- **Facturación:** ID de factura simplificado (ej. #A1B2C3).
- **Configuración:** Sincronización automática de versión con package.json.

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
