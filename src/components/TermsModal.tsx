import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"


export function TermsModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const accepted = localStorage.getItem('terms-accepted')
        if (!accepted) {
            setIsOpen(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('terms-accepted', 'true')
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Términos y Condiciones</DialogTitle>
                    <DialogDescription>
                        Por favor lee y acepta los términos de uso para continuar.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[300px] w-full rounded-md border p-4 text-sm text-muted-foreground overflow-y-auto">
                    <h4 className="font-bold mb-2 text-foreground">1. Uso del Sistema</h4>
                    <p className="mb-4">
                        Este sistema de punto de venta se proporciona "tal cual". El usuario es responsable de mantener la seguridad de sus credenciales y de los datos ingresados en el sistema.
                    </p>

                    <h4 className="font-bold mb-2 text-foreground">2. Responsabilidad</h4>
                    <p className="mb-4">
                        No nos hacemos responsables por pérdidas de datos, interrupciones del servicio o errores en los cálculos financieros derivados del uso incorrecto del software.
                    </p>

                    <h4 className="font-bold mb-2 text-foreground">3. Privacidad</h4>
                    <p className="mb-4">
                        Los datos de su negocio son almacenados de forma segura. No compartimos información con terceros sin su consentimiento explícito.
                    </p>

                    <h4 className="font-bold mb-2 text-foreground">4. Modificaciones</h4>
                    <p className="mb-4">
                        Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del sistema implica la aceptación de dichos cambios.
                    </p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <Button onClick={handleAccept} className="w-full">
                        Aceptar y Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
