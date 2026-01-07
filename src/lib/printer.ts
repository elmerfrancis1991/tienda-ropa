import { Venta } from '@/hooks/useCart'
import { APP_VERSION } from '@/version'

interface PrintSettings {
    businessName: string
    rnc: string
    direccion: string
    telefono: string
    email: string
    logoUrl?: string
}

export const printTicket = (venta: Venta, settings: PrintSettings, copies: number = 1) => {
    // ...
    const generateHtml = () => `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${venta.id}</title>
            <style>
                @page { margin: 0; size: 58mm auto; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 13px; 
                    width: 58mm; 
                    max-width: 58mm;
                    padding: 2mm;
                    color: black;
                    line-height: 1.4;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { 
                    border-bottom: 2px dashed #000; 
                    margin: 5px 0; 
                }
                .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
                .small { font-size: 11px; }
                table { width: 100%; border-collapse: collapse; }
                td, th { padding: 2px 0; vertical-align: top; }
                .col-qty { width: 15%; }
                .col-desc { width: 50%; }
                .col-price { width: 35%; text-align: right; }
                .total-row td { padding-top: 4px; }
                .grand-total { font-size: 15px; font-weight: bold; }
            </style>
        </head>
        <body>
            ${settings.logoUrl ? `<div class="center" style="margin-bottom: 8px;"><img src="${settings.logoUrl}" style="max-width: 50px; max-height: 50px;" /></div>` : ''}
            <div class="center header">${settings.businessName}</div>
            <div class="center small">RNC: ${settings.rnc}</div>
            <div class="center small">${settings.direccion}</div>
            <div class="center small">Tel: ${settings.telefono}</div>
            
            <div class="line"></div>
            
            <div>Fecha: ${new Date(venta.fecha).toLocaleString()}</div>
            <div class="bold">Ticket #: ${venta.id.slice(-8).toUpperCase()}</div>
            <div>Cliente: ${venta.cliente || 'Cliente General'}</div>
            
            <div class="line"></div>

            <table>
                <thead>
                    <tr class="bold">
                        <th class="col-qty">Cant</th>
                        <th class="col-desc">Desc</th>
                        <th class="col-price">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.items.map(item => `
                        <tr>
                            <td class="col-qty">${item.cantidad}</td>
                            <td class="col-desc">${item.producto.nombre.substring(0, 20)}</td>
                            <td class="col-price">${item.subtotal.toFixed(2)}</td>
                        </tr>
                        ${item.cantidad > 1 ? `<tr class="small"><td colspan="3">  (${item.cantidad} x ${item.producto.precio.toFixed(2)})</td></tr>` : ''}
                    `).join('')}
                </tbody>
            </table>

            <div class="line"></div>

            <table style="margin-top: 4px;">
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
            
            <div class="center bold" style="margin-top: 8px; font-size: 14px;">¡Gracias por su compra!</div>
            <div class="center small" style="margin-top: 4px;">Sistema POS v${APP_VERSION}</div>
        </body>
        </html>
    `

    const printOne = () => {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        const doc = iframe.contentWindow?.document
        if (!doc) return

        doc.open()
        doc.write(generateHtml())
        doc.close()

        iframe.onload = () => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            setTimeout(() => document.body.removeChild(iframe), 1000)
        }
    }

    // Print multiple copies
    for (let i = 0; i < copies; i++) {
        printOne()
    }
}

