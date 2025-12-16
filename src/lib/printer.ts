
import { Venta } from '@/hooks/useCart'

interface PrintSettings {
    businessName: string
    rnc: string
    direccion: string
    telefono: string
    email: string
    logoUrl?: string
}

export const printTicket = (venta: Venta, settings: PrintSettings) => {
    // Create hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    // Format Date
    const date = venta.fecha ? new Date(venta.fecha).toLocaleString() : new Date().toLocaleString()

    // Generate HTML - Optimizado para impresora de tickets 58mm
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${venta.id}</title>
            <style>
                @page { margin: 0; size: 58mm auto; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 11px; 
                    width: 58mm; 
                    max-width: 58mm;
                    padding: 2mm;
                    color: black;
                    line-height: 1.3;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { 
                    border-bottom: 1px dashed #000; 
                    margin: 3px 0; 
                }
                .header { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
                .small { font-size: 9px; }
                table { width: 100%; border-collapse: collapse; }
                td, th { padding: 1px 0; vertical-align: top; }
                .col-qty { width: 12%; }
                .col-desc { width: 53%; }
                .col-price { width: 35%; text-align: right; }
                .total-row td { padding-top: 2px; }
                .grand-total { font-size: 13px; font-weight: bold; }
            </style>
        </head>
        <body>
            ${settings.logoUrl ? `<div class="center" style="margin-bottom: 5px;"><img src="${settings.logoUrl}" style="max-width: 40px; max-height: 40px;" /></div>` : ''}
            <div class="center header">${settings.businessName}</div>
            <div class="center small">RNC: ${settings.rnc}</div>
            <div class="center small">${settings.direccion}</div>
            <div class="center small">Tel: ${settings.telefono}</div>
            
            <div class="line"></div>
            
            <div>Fecha: ${date}</div>
            <div>Ticket #: ${venta.id.slice(-8).toUpperCase()}</div>
            <div>Cliente: ${venta.cliente || 'Cliente General'}</div>
            
            <div class="line"></div>

            <table>
                <thead>
                    <tr class="bold">
                        <th class="col-qty">Can</th>
                        <th class="col-desc">Desc</th>
                        <th class="col-price">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.items.map(item => `
                        <tr>
                            <td class="col-qty">${item.cantidad}</td>
                            <td class="col-desc">${item.producto.nombre.substring(0, 18)}</td>
                            <td class="col-price">${item.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="line"></div>

            <table>
                <tr class="total-row">
                    <td>Subtotal:</td>
                    <td class="right">${venta.subtotal.toFixed(2)}</td>
                </tr>
                ${venta.descuento > 0 ? `
                <tr>
                    <td>Descuento:</td>
                    <td class="right">-${venta.descuento.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${venta.impuesto > 0 ? `
                <tr>
                    <td>ITBIS (18%):</td>
                    <td class="right">${venta.impuesto.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr class="grand-total">
                    <td>TOTAL:</td>
                    <td class="right">${venta.total.toFixed(2)}</td>
                </tr>
            </table>

            <div class="line"></div>
            
            <div class="center" style="margin-top: 4px;">¡Gracias por su compra!</div>
            <div class="center small" style="margin-top: 2px;">Sistema POS</div>
        </body>
        </html>
    `

    doc.open()
    doc.write(html)
    doc.close()

    // Wait for images/resources to load then print
    iframe.onload = () => {
        try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
        } catch (e) {
            console.error(e)
        }
        // Cleanup after print dialog usage (add small delay for stability)
        setTimeout(() => {
            document.body.removeChild(iframe)
        }, 1000)
    }
}
