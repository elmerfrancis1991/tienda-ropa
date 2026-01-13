/**
 * Genera un código de barras único para un producto/variante
 * Formato: NOMBRE-PRECIO-VARIANTE-TIMESTAMP
 */
export function generateBarcode(nombre: string, precio: number, variante: string): string {
    // Limpiar nombre: quitar espacios, especiales, max 5 chars
    const cleanName = nombre
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5);

    // Precio entero
    const cleanPrice = Math.floor(precio).toString();

    // Limpiar variante
    const cleanVariant = variante
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3);

    // Timestamp corto (últimos 6 dígitos)
    const timestamp = Date.now().toString().slice(-6);

    // Random 2 chars para colisiones
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return `${cleanName}${cleanPrice}${cleanVariant}${random}`;
}
