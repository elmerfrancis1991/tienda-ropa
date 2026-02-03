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
    const generateHtml = () => `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${venta.id}</title>
            <style>
                @page { margin: 0; size: 70mm auto; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 13px; 
                    width: 70mm; 
                    max-width: 70mm;
                    padding: 3mm; 
                    color: black;
                    line-height: 1.2;
                    font-weight: 500;
                }
                .ticket-strip {
                    page-break-after: always;
                    border-bottom: 1px dotted #000;
                    margin-bottom: 5mm;
                    padding-bottom: 5mm;
                }
                .ticket-strip:last-child {
                    page-break-after: auto;
                    border-bottom: none;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { 
                    border-bottom: 1px dashed #000; 
                    margin: 3mm 0; 
                }
                .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
                .small { font-size: 11px; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                td, th { padding: 2px 0; vertical-align: top; font-size: 11px; }
                
                /* Adjusted Column Widths for spacing */
                .col-qty { width: 10%; text-align: center; }
                .col-desc { width: 45%; text-align: left; padding-right: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
                .col-price { width: 20%; text-align: right; }
                .col-total { width: 25%; text-align: right; font-weight: bold; }
                
                .total-row td { padding-top: 4px; font-weight: bold; font-size: 12px; }
                .grand-total td { font-size: 14px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
            </style>
        </head>
        <body>
            ${Array(copies).fill(0).map(() => `
                <div class="ticket-strip">
                    ${settings.logoUrl ? `<div class="center" style="margin-bottom: 4px;"><img src="${settings.logoUrl}" style="max-width: 40px; max-height: 40px;" /></div>` : ''}
                    <div class="center header">${settings.businessName}</div>
                    ${settings.rnc ? `<div class="center small">RNC: ${settings.rnc}</div>` : ''}
                    ${settings.direccion ? `<div class="center small">${settings.direccion}</div>` : ''}
                    ${settings.telefono ? `<div class="center small">Tel: ${settings.telefono}</div>` : ''}
                    
                    <div class="line"></div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span>${new Date(venta.fecha).toLocaleDateString('es-DO')}</span>
                        <span>${new Date(venta.fecha).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <div class="bold" style="font-size: 12px; margin-top: 2px;">Ticket: ${venta.id?.slice(-8).toUpperCase() || 'N/A'}</div>
                    <div style="font-size: 12px;">Cliente: ${venta.cliente || 'Contado'}</div>
                    
                    <div class="line"></div>

                    <table>
                        <thead>
                            <tr class="bold" style="border-bottom: 1px solid #000;">
                                <th class="col-qty">Cant</th>
                                <th class="col-desc">Desc</th>
                                <th class="col-price">Precio</th>
                                <th class="col-total">Total</th>
                            </tr>
                        </thead>
                        <tbody style="margin-top: 4px;">
                            ${venta.items.map(item => `
                                <tr>
                                    <td class="col-qty">${item.cantidad}</td>
                                    <td class="col-desc">
                                        ${item.producto.nombre}
                                        ${item.producto.talla ? `<div style="font-size: 9px; color: #555;">${item.producto.talla === 'Unica' ? '' : item.producto.talla}</div>` : ''}
                                    </td>
                                    <td class="col-price">${item.producto.precio.toFixed(0)}</td>
                                    <td class="col-total">${item.subtotal.toFixed(0)}</td>
                                </tr>
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

                    <div style="font-size: 11px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Método de Pago:</span>
                            <span class="capitalize">${venta.metodoPago}</span>
                        </div>
                        ${venta.metodoPago === 'efectivo' && venta.montoRecibido !== undefined ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Monto Recibido:</span>
                            <span>${venta.montoRecibido.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;" class="bold">
                            <span>Cambio:</span>
                            <span>${(venta.cambio || 0).toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="line"></div>
                    
                    <div class="center bold" style="margin-top: 8px; font-size: 14px;">¡Gracias por su compra!</div>
                </div>
            `).join('')}
        </body>
        </html>
    `

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
