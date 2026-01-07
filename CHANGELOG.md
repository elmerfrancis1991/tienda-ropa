# Historial de Mejoras (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.3.6-rc.3] - 2026-01-07
### fixed
- **Historial:** Corregidos filtros de fecha (Hoy, Semana, Mes).
- **Usuarios:** Mejorada la visibilidad de vendedores para administradores.
- **Versión:** Forzada sincronización global a v1.3.6-rc.3.

## [1.3.6-rc.2] - 2026-01-07
### fixed
- Versión actualizada para forzar despliegue y visibilidad de cambios.
- Todas las mejoras de v1.3.6-rc.1 consolidadas.

## [1.3.6-rc.1] - 2026-01-07
### Agregado
- **POS (Tickets):** Implementado selector de cantidad de copias al finalizar la venta.
- **POS (Tickets):** Aumentado tamaño de fuente y grosor de líneas para mejor legibilidad en impresoras térmicas de 58mm.
- **Sistema:** Automatizada la visualización de versión y fecha de actualización en la página de Configuración.

### Corregido
- **POS (Carrito):** Los productos con el mismo ID ahora se agregan como líneas independientes ("cada item es diferente"), facilitando el control unitario.
- **Usuarios:** Corregida la creación de usuarios para administradores; ahora se asigna automáticamente el `tenantId` correcto, permitiendo que los nuevos usuarios sean visibles por su administrador.
- **Core:** Centralizada la gestión de versiones en un archivo maestro para evitar discrepancias.

## [1.3.5-rc.5] - 2026-01-07

## [1.3.5-rc.4] - 2026-01-07
### Corregido
- **Definitive Root Fix:** Eliminados todos los requerimientos de índices compuestos mediante ordenamiento en cliente (memoria). Esto garantiza que el sistema funcione en cualquier entorno sin configuración manual.
- **UI Polishing:** El mensaje de error ahora es totalmente dinámico y desaparece automáticamente cuando el sistema carga correctamente.

## [1.3.5-rc.3] - 2026-01-07
### Corregido
- **Root Fix (Permisos):** Implementada autoreparación de documentos de usuario en inicio de sesión (agrega `tenantId` y `role` faltantes).
- **Security Rules:** Simplificadas las reglas de Firestore para permitir acceso a documentos antiguos sin `tenantId` (tratándolos como `'default'`).
- **UI:** El mensaje de error en la Caja ya no es intrusivo y solo se muestra en caso de falla real del servidor.

## [1.3.5-rc.2] - 2026-01-07
### Corregido
- **Seguridad (CRÍTICO):** Corregidas Reglas de Firestore para manejar correctamente el valor por defecto `'default'` cuando el campo `tenantId` está ausente.
- **Hooks:** Implementado filtrado obligatorio por `tenantId` en todos los hooks (`useUsuarios`, `useVentas`) para prevenir errores de permisos insuficientes.

## [1.3.5-rc.1] - 2026-01-07
### Corregido
- **Auth:** Corregida condición de carrera en inicio de sesión que ignoraba permisos personalizados.
- **Usuarios:** Reseteo automático de permisos al cambiar de rol en la creación de nuevos usuarios.
- **Caja:** Mejora en el diagnóstico de errores con mensajes detallados en pantalla.
- **Seguridad:** Implementado filtrado estricto por `tenantId` en ventas para aislamiento multi-empresa.

## [1.3.4] - 2026-01-06 (No registrado previamente)
- Sincronización de versión.

## [1.3.2] - 2026-01-06
### Corregido
- **POS:** Validación de stock ahora suma TODAS las variantes (tallas/colores) del mismo producto.
- **POS:** El botón "+" se deshabilita cuando el total de unidades en carrito alcanza el stock disponible.
- **POS:** Indicador visual naranja cuando se alcanza el límite de stock.
- **POS:** Actualización automática del inventario después de completar una venta (sin necesidad de F5).
- **UX:** Tooltip mejorado muestra el stock máximo y la cantidad total en carrito.

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

### 🛡️ System Hardening & Seguridad (Major Update)
Se ha implementado una suite de 30 pruebas automatizadas y mejoras de robustez:
- **Validación Estricta:** Implementados esquemas Zod para prevenir datos inválidos (precios negativos, XSS).
- **Seguridad en BD:** Nuevas reglas de Firestore (`firestore.rules`) para proteger integridad de datos y evitar escalada de privilegios.
- **Pruebas Automatizadas:** 
    - 10 Pruebas de Seguridad/BD (Permisos, Estructura).
    - 10 Pruebas Funcionales (Flujos Críticos, Inventario).
    - 10 Pruebas Avanzadas (Inyección, DoS, Lógica de Negocio).
- **Estabilidad:** Corrección de vulnerabilidades de "Prototype Pollution" y manejo de errores.

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
