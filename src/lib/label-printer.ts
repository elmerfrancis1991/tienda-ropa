import { Producto } from "@/types";

export interface LabelData {
  nombre: string;
  precio: number;
  codigoBarra: string;
  variante?: string;
}

export function printLabels(producto: Producto, cantidad: number = 1) {
  const windowContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imprimir Etiquetas</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=Inter:wght@400;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 20px;
          }
          
          .label-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, 50mm);
            gap: 5mm;
          }
          
          .label {
            width: 50mm;
            height: 25mm;
            border: 1px dashed #ccc;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-inside: avoid;
          }
          
          .nombre {
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          
          .precio {
            font-size: 12px;
            font-weight: 700;
            margin: 1px 0;
          }
          
          .barcode {
            font-family: 'Libre Barcode 128', cursive;
            font-size: 28px;
            line-height: 1;
            margin: 2px 0;
          }
          
          .codigo-texto {
            font-size: 8px;
            font-family: monospace;
          }
          
          .variante {
            font-size: 8px;
            color: #555;
            margin-top: 1px;
          }

          @media print {
            .label {
              border: none;
            }
            @page {
              size: auto;
              margin: 0mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${Array(cantidad).fill(0).map(() => `
            <div class="label">
              <div class="nombre">${producto.nombre}</div>
              <div class="precio">RD$${producto.precio.toLocaleString()}</div>
              <div class="barcode">${producto.codigoBarra}</div>
              ${(producto.talla || producto.color)
      ? `<div class="variante">${producto.talla || ''} ${producto.color || ''}</div>`
      : ''}
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = () => {
            window.print();
            // window.close(); // Opcional: cerrar después de imprimir
          }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(windowContent);
    printWindow.document.close();
  }
}
