# Sistema de Punto de Venta (POS) Profesional

Sistema integral de gestión de inventario y ventas diseñado para tiendas de ropa y retail. Desarrollado con tecnología moderna para garantizar velocidad, seguridad y escalabilidad.

![Dashboard Preview](./dashboard-preview.png)

## 🚀 Características Principales

### 💼 Gestión Comercial
- **Punto de Venta (POS):** Interfaz ágil para ventas rápidas con cálculo automático de cambio.
- **Inventario:** Control de stock en tiempo real con alertas de bajo inventario.
- **Productos:** Gestión completa con imágenes, códigos de barras, categorías y precios.
- **Cierre de Caja:** Arqueo de caja diario con historial y desglose de efectivo/tarjeta.

### 👥 Administración
- **Roles y Permisos:** Sistema granular de permisos para Administradores y Vendedores.
- **Usuarios:** Gestión de cuentas de empleados con control de acceso seguro.
- **Historial de Ventas:** Registro detallado de todas las transacciones.
- **Reportes:** Estadísticas de ventas y rendimiento (Próximamente).

### 🛡️ Seguridad
- **Autenticación Segura:** Protección mediante correo y contraseña.
- **Recuperación de Contraseña:** Sistema integrado de restablecimiento de credenciales.
- **Datos en la Nube:** Respaldo automático en Google Firebase.

---

## 📚 Manual de Instalación

### Requisitos Previos
- Node.js (Versión 18 o superior)
- npm (Gestor de paquetes)
- Cuenta de Google (para configuración de Firebase)

### Pasos de Instalación

1. **Descomprimir el Archivo**
   Extraiga los archivos del sistema en su carpeta de preferencia.

2. **Instalar Dependencias**
   Abra una terminal en la carpeta del proyecto y ejecute:
   ```bash
   npm install
   ```

3. **Configuración de Firebase**
   - Cree un proyecto en [Firebase Console](https://console.firebase.google.com/).
   - Active **Authentication** (Email/Password).
   - Cree una base de datos **Firestore**.
   - Copie las credenciales de su proyecto en un archivo `.env` en la raíz (use `.env.example` como guía):
     ```env
     VITE_FIREBASE_API_KEY=su_api_key
     VITE_FIREBASE_AUTH_DOMAIN=su_proyecto.firebaseapp.com
     ...
     ```

4. **Desplegar Reglas de Seguridad**
   Para asegurar los datos, ejecute:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```

5. **Iniciar el Sistema**
   Para modo desarrollo:
   ```bash
   npm run dev
   ```
   Para producción (construir):
   ```bash
   npm run build
   npm run preview
   ```

---

## 📖 Manual de Usuario Rápido

### Primeros Pasos
1. **Acceso:** Inicie sesión con las credenciales de administrador proporcionadas.
2. **Crear Usuarios:** Vaya a la sección "Usuarios" para registrar a sus vendedores.

### Realizar una Venta
1. Vaya a **"Punto de Venta"**.
2. Busque productos por nombre o seleccione de la lista.
3. Ajuste cantidades en el carrito derecho.
4. Haga clic en **"Cobrar"**, ingrese el monto recibido y finalice.

### Gestión de Inventario
1. Vaya a **"Productos e Inventario"**.
2. Use el botón **"Nuevo Producto"** para agregar ítems.
3. Use el botón **"+"** en cada tarjeta para agregar stock rápidamente.
4. Filtre por **"Bajo Stock"** para ver qué necesita reponer.

### Cierre de Caja
1. Al finalizar el turno, vaya a **"Caja"**.
2. Verifique el monto esperado vs. real.
3. Haga clic en **"Cerrar Caja"**.

---

## 🆘 Soporte

Para soporte técnico o consultas sobre la licencia, contacte a:
**Soporte Técnico**
Email: soporte@sistema-pos.com
Horario: Lunes a Viernes 9:00 - 18:00

---
© 2024 Todos los derechos reservados.
