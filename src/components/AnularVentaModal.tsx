import { useState } from 'react'
import { Venta } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AnularVentaModalProps {
    open: boolean
    onClose: () => void
    venta: Venta | null
    onConfirm: (motivo: string) => Promise<void>
}

export function AnularVentaModal({ open, onClose, venta, onConfirm }: AnularVentaModalProps) {
    const [motivo, setMotivo] = useState('')
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState('')

    if (!venta) return null

    const handleConfirm = async () => {
        if (!motivo.trim()) {
            setError('El motivo de anulación es obligatorio')
            return
        }

        setProcessing(true)
        setError('')

        try {
            await onConfirm(motivo)
            setMotivo('')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al anular la venta')
        } finally {
            setProcessing(false)
        }
    }

    const handleClose = () => {
        setMotivo('')
        setError('')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                    </div>
                    <DialogTitle className="text-center">Anular Venta</DialogTitle>
                    <DialogDescription className="text-center">
                        Esta acción revertirá el stock de los productos vendidos
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Detalles de la venta */}
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-mono">{venta.id?.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha:</span>
                            <span>{new Date(venta.fecha).toLocaleDateString('es-DO')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Items:</span>
                            <span>{venta.items.length}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-primary">{formatCurrency(venta.total)}</span>
                        </div>
                    </div>

                    {/* Motivo de anulación */}
                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo de Anulación *</Label>
                        <Input
                            id="motivo"
                            placeholder="Ej: Devolución por defecto, error en venta..."
                            value={motivo}
                            onChange={(e) => {
                                setMotivo(e.target.value)
                                setError('')
                            }}
                            disabled={processing}
                            maxLength={200}
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    {/* Advertencia */}
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                            <strong>Advertencia:</strong> Esta acción no se puede deshacer. El stock de los productos será restaurado automáticamente.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={processing}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={processing || !motivo.trim()}
                        className="w-full sm:w-auto"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Anulando...
                            </>
                        ) : (
                            'Confirmar Anulación'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
