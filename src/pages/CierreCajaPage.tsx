import { useState } from 'react'
import {
    Wallet,
    DoorOpen,
    DoorClosed,
    Clock,
    Calculator,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    History,
    DollarSign,
    CreditCard,
    TrendingUp,
    TrendingDown,
    User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, cn } from '@/lib/utils'
import { useCierreCaja } from '@/hooks/useCierreCaja'
import { useVentas } from '@/hooks/useVentas'

export default function CierreCajaPage() {
    const { cierres, cajaActual, loading, abrirCaja, cerrarCaja, isCajaAbierta } = useCierreCaja()
    const { ventas } = useVentas()

    const [showAbrirModal, setShowAbrirModal] = useState(false)
    const [showCerrarModal, setShowCerrarModal] = useState(false)
    const [montoApertura, setMontoApertura] = useState('')
    const [montoCierre, setMontoCierre] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Calcular ventas del día por método de pago
    const ventasDelDia = (() => {
        if (!cajaActual) return { efectivo: 0, tarjeta: 0, total: 0 }

        const ventasHoy = ventas.filter(v => {
            // Si la venta tiene cajaId, filtrar por ID exacto
            if (v.cajaId) {
                return v.cajaId === cajaActual.id
            }
            // Fallback: Filtrar por fecha si no hay cajaId (migración/ventas viejas)
            const fechaVenta = v.fecha instanceof Date ? v.fecha : new Date(v.fecha)
            const fechaApertura = cajaActual.createdAt instanceof Date
                ? cajaActual.createdAt
                : new Date(cajaActual.createdAt)
            return fechaVenta >= fechaApertura
        })

        const efectivo = ventasHoy
            .filter(v => v.metodoPago === 'efectivo')
            .reduce((sum, v) => sum + v.total, 0)

        const tarjeta = ventasHoy
            .filter(v => v.metodoPago === 'tarjeta')
            .reduce((sum, v) => sum + v.total, 0)

        const transferencia = ventasHoy
            .filter(v => v.metodoPago === 'transferencia')
            .reduce((sum, v) => sum + v.total, 0)

        return { efectivo, tarjeta, transferencia, total: efectivo + tarjeta + transferencia }
    })()

    const handleAbrirCaja = async () => {
        const monto = parseFloat(montoApertura)
        if (isNaN(monto) || monto < 0) {
            setError('Ingrese un monto válido')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await abrirCaja(monto)
            setShowAbrirModal(false)
            setMontoApertura('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al abrir caja')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCerrarCaja = async () => {
        const monto = parseFloat(montoCierre)
        if (isNaN(monto) || monto < 0) {
            setError('Ingrese un monto válido')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await cerrarCaja(
                monto,
                ventasDelDia.efectivo || 0,
                ventasDelDia.tarjeta || 0,
                ventasDelDia.transferencia || 0,
                observaciones
            )
            setShowCerrarModal(false)
            setMontoCierre('')
            setObservaciones('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cerrar caja')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-DO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Wallet className="h-8 w-8 text-primary" />
                        Cierre de Caja
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestión de apertura y cierre de caja diario
                    </p>
                </div>
                <div className="flex gap-2">
                    {isCajaAbierta ? (
                        <Button onClick={() => setShowCerrarModal(true)} variant="destructive">
                            <DoorClosed className="h-4 w-4 mr-2" />
                            Cerrar Caja
                        </Button>
                    ) : (
                        <Button onClick={() => setShowAbrirModal(true)}>
                            <DoorOpen className="h-4 w-4 mr-2" />
                            Abrir Caja
                        </Button>
                    )}
                </div>
            </div>

            {/* Estado Actual */}
            {cajaActual && (
                <Card className="border-green-500/50 bg-green-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Caja Abierta
                        </CardTitle>
                        <CardDescription>
                            Abierta el {formatDate(cajaActual.createdAt)} por {cajaActual.usuarioNombre}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Monto Apertura</p>
                                <p className="text-xl font-bold">{formatCurrency(cajaActual.montoApertura)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Ventas Efectivo
                                </p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(ventasDelDia.efectivo)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" /> Ventas Tarjeta
                                </p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(ventasDelDia.tarjeta)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> Transferencias
                                </p>
                                <p className="text-xl font-bold text-purple-600">{formatCurrency(ventasDelDia.transferencia)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Esperado en Caja</p>
                                <p className="text-xl font-bold text-primary">
                                    {formatCurrency((cajaActual?.montoApertura || 0) + (ventasDelDia?.efectivo || 0))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isCajaAbierta && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">Caja Cerrada</h3>
                        <p className="text-muted-foreground mt-1">
                            Debe abrir la caja para comenzar a registrar ventas
                        </p>
                        <Button className="mt-4" onClick={() => setShowAbrirModal(true)}>
                            <DoorOpen className="h-4 w-4 mr-2" />
                            Abrir Caja
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Historial */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Cierres
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {cierres.filter(c => c.estado === 'cerrado').length > 0 ? (
                        <div className="space-y-3">
                            {cierres.filter(c => c.estado === 'cerrado').slice(0, 10).map((cierre) => (
                                <div
                                    key={cierre.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary">
                                                {formatDate(cierre.fecha)}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {cierre.usuarioNombre}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                                            <span>Apertura: {formatCurrency(cierre.montoApertura)}</span>
                                            <span>Cierre: {formatCurrency(cierre.montoCierre)}</span>
                                            <span>Ventas: {formatCurrency(cierre.ventasTotal)}</span>
                                            {cierre.ventasTransferencia > 0 && (
                                                <span className="text-purple-600">Trf: {formatCurrency(cierre.ventasTransferencia)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                                            cierre.diferencia === 0
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : cierre.diferencia > 0
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {cierre.diferencia === 0 ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : cierre.diferencia > 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {cierre.diferencia === 0
                                                ? 'Cuadrado'
                                                : `${cierre.diferencia > 0 ? '+' : ''}${formatCurrency(cierre.diferencia)}`
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay cierres registrados</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Abrir Caja */}
            <Dialog open={showAbrirModal} onOpenChange={setShowAbrirModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DoorOpen className="h-5 w-5 text-primary" />
                            Abrir Caja
                        </DialogTitle>
                        <DialogDescription>
                            Ingrese el monto inicial en caja para comenzar el día
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="montoApertura">Monto de Apertura (RD$)</Label>
                            <Input
                                id="montoApertura"
                                type="number"
                                placeholder="0.00"
                                value={montoApertura}
                                onChange={(e) => setMontoApertura(e.target.value)}
                            />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbrirModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAbrirCaja} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Abrir Caja
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Cerrar Caja */}
            <Dialog open={showCerrarModal} onOpenChange={setShowCerrarModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DoorClosed className="h-5 w-5 text-destructive" />
                            Cerrar Caja
                        </DialogTitle>
                        <DialogDescription>
                            Cuente el efectivo en caja e ingrese el monto final
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Resumen */}
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Monto Apertura:</span>
                                <span className="font-medium">{formatCurrency(cajaActual?.montoApertura || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Ventas Efectivo:</span>
                                <span className="font-medium text-green-600">+{formatCurrency(ventasDelDia.efectivo)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Ventas Tarjeta:</span>
                                <span className="font-medium text-blue-600">{formatCurrency(ventasDelDia.tarjeta)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Transferencias:</span>
                                <span className="font-medium text-purple-600">{formatCurrency(ventasDelDia.transferencia)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Esperado en Caja:</span>
                                <span className="text-primary">
                                    {formatCurrency((cajaActual?.montoApertura || 0) + ventasDelDia.efectivo)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="montoCierre">Monto Contado en Caja (RD$)</Label>
                            <Input
                                id="montoCierre"
                                type="number"
                                placeholder="0.00"
                                value={montoCierre}
                                onChange={(e) => setMontoCierre(e.target.value)}
                            />
                        </div>

                        {montoCierre && (
                            <div className={cn(
                                "p-3 rounded-md",
                                parseFloat(montoCierre) === (cajaActual?.montoApertura || 0) + ventasDelDia.efectivo
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            )}>
                                <p className="text-sm font-medium">
                                    Diferencia: {formatCurrency(
                                        parseFloat(montoCierre) - ((cajaActual?.montoApertura || 0) + ventasDelDia.efectivo)
                                    )}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                            <textarea
                                id="observaciones"
                                placeholder="Notas adicionales..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCerrarModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCerrarCaja} disabled={isSubmitting} variant="destructive">
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Cerrar Caja
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
