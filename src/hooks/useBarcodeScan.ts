import { useEffect, useState } from 'react';

// Hook para capturar entrada de escáner de código de barras (emulación de teclado)
export function useBarcodeScan(onScan: (barcode: string) => void) {
    const [barcode, setBarcode] = useState('');
    const [lastKeyTime, setLastKeyTime] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // Si el tiempo entre teclas es muy largo (>100ms), reiniciamos (usuario escribiendo manual)
            // Los escáneres envían caracteres muy rápido (20-50ms)
            if (currentTime - lastKeyTime > 100) {
                setBarcode('');
            }
            setLastKeyTime(currentTime);

            // Si es Enter, se completó el escaneo
            if (e.key === 'Enter') {
                if (barcode.length > 2) { // Mínimo length para considerar válido
                    onScan(barcode);
                    setBarcode('');
                }
            } else if (e.key.length === 1) {
                // Acumular caracteres imprimibles
                setBarcode(prev => prev + e.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [barcode, lastKeyTime, onScan]);

    return;
}
