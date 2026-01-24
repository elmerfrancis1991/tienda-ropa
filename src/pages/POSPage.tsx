import { useState, useMemo, useEffect, useRef } from 'react'
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Building2,
    X,
    Loader2,
    Check,
    Package,
    Menu,
    Receipt,
    Printer,
    Barcode,
} from 'lucide-react'
import { printTicket } from '@/lib/printer'
import { useBarcodeScan } from '@/hooks/useBarcodeScan'
import { useProductos } from '@/hooks/useProductos'
import { useCart, Venta } from '@/hooks/useCart'
import { useVentas } from '@/hooks/useVentas'
import { useCierreCaja } from '@/hooks/useCierreCaja'
import { useAuth } from '@/contexts/AuthContext'
import { useConfig } from '@/contexts/ConfigContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Producto } from '@/types'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'

const ProductImage = ({ src, alt }: { src?: string; alt: string }) => {
    const [error, setError] = useState(false)

    if (!src || error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
        />
    )
}

interface CheckoutModalProps {
    open: boolean
    onClose: () => void
    total: number
    onCheckout: (metodo: 'efectivo' | 'tarjeta' | 'transferencia', montoRecibido?: number, cambio?: number) => void
}

function CheckoutModal({ open, onClose, total, onCheckout }: CheckoutModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | null>(null)
    const [processing, setProcessing] = useState(false)
    const [montoRecibido, setMontoRecibido] = useState('')

    // Calcular cambio
    const montoRecibidoNum = parseFloat(montoRecibido) || 0
    const cambio = montoRecibidoNum - total
    const cambioValido = cambio >= 0
    const efectivoListo = selectedMethod === 'efectivo' ? (montoRecibidoNum >= total) : true

    const handleCheckout = async () => {
        if (!selectedMethod) return
        if (selectedMethod === 'efectivo' && !efectivoListo) return
        setProcessing(true)
        // Simulate processing time but logic is handled by parent
        await onCheckout(selectedMethod, selectedMethod === 'efectivo' ? montoRecibidoNum : undefined, selectedMethod === 'efectivo' ? cambio : undefined)
        setProcessing(false)
        setSelectedMethod(null)
        setMontoRecibido('')
    }

    // Reset monto recibido al cambiar método
    const handleMethodSelect = (method: 'efectivo' | 'tarjeta' | 'transferencia') => {
        setSelectedMethod(method)
        if (method !== 'efectivo') {
            setMontoRecibido('')
        }
    }

    // Reset al cerrar
    const handleClose = () => {
        setSelectedMethod(null)
        setMontoRecibido('')
        onClose()
    }

    const paymentMethods = [
        { id: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
        { id: 'tarjeta' as const, label: 'Tarjeta', icon: CreditCard },
        { id: 'transferencia' as const, label: 'Transfer.', icon: Building2 },
    ]

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Procesar Pago</DialogTitle>
                    <DialogDescription className="text-sm">
                        Total: <span className="text-primary font-bold text-base sm:text-lg">{formatCurrency(total)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Método de Pago</p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => handleMethodSelect(method.id)}
                                className={`flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${selectedMethod === method.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <method.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-[10px] sm:text-xs font-medium">{method.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Cálculo de Cambio para Efectivo */}
                    {selectedMethod === 'efectivo' && (
                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                            <div className="space-y-2">
                                <Label htmlFor="monto-recibido" className="text-sm font-medium">
                                    Monto Recibido
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                    <Input
                                        id="monto-recibido"
                                        type="number"
                                        placeholder="0.00"
                                        value={montoRecibido}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.length <= 10) {
                                                setMontoRecibido(val);
                                            }
                                        }}
                                        className="pl-7 text-lg font-semibold"
                                        autoFocus
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {montoRecibidoNum > 0 && (
                                <div className={`p-3 rounded-lg overflow-hidden ${cambioValido ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                                        <span className={`text-sm font-medium shrink-0 ${cambioValido ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                            {cambioValido ? 'Cambio a devolver:' : 'Monto insuficiente:'}
                                        </span>
                                        <span className={`text-lg font-bold break-all ${cambioValido ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {cambioValido ? formatCurrency(cambio) : formatCurrency(Math.abs(cambio))}
                                        </span>
                                    </div>
                                    {!cambioValido && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            Faltan {formatCurrency(Math.abs(cambio))} para completar el pago
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={processing} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCheckout}
                        disabled={!selectedMethod || processing || !efectivoListo}
                        className="w-full sm:w-auto"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                {selectedMethod === 'efectivo' && cambioValido && montoRecibidoNum > 0
                                    ? `Confirmar (Cambio: ${formatCurrency(cambio)})`
                                    : 'Confirmar'
                                }
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface SaleCompleteModalProps {
    open: boolean
    onClose: () => void
    venta: Venta | null
    settings: any
}

function SaleCompleteModal({ open, onClose, venta, settings }: SaleCompleteModalProps) {
    if (!venta) return null

    const [copies, setCopies] = useState(1)
    const { user } = useAuth()

    const handlePrint = () => {
        printTicket(venta, {
            businessName: settings.businessName || user?.empresaNombre || 'Negocio',
            rnc: settings.rnc,
            direccion: settings.direccion,
            telefono: settings.telefono,
            email: settings.email
        }, copies)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                    <DialogTitle className="text-center text-base sm:text-lg">¡Venta Completada!</DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        La venta se ha procesado exitosamente
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 sm:space-y-3 bg-muted/50 p-3 sm:p-4 rounded-lg text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono text-xs">{venta.id?.slice(-8).toUpperCase() || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span>{venta.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Método:</span>
                        <span className="capitalize">{venta.metodoPago}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">{formatCurrency(venta.total)}</span>
                    </div>
                    {venta.metodoPago === 'efectivo' && venta.montoRecibido !== undefined && (
                        <>
                            <Separator />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Efectivo Recibido:</span>
                                <span>{formatCurrency(venta.montoRecibido)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400">
                                <span>Cambio:</span>
                                <span>{formatCurrency(venta.cambio || 0)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3 justify-center py-2">
                    <Label htmlFor="print-copies" className="text-sm">Copias:</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCopies(Math.max(1, copies - 1))}>
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{copies}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCopies(Math.min(10, copies + 1))}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir Ticket
                    </Button>
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Nueva Venta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function POSPage() {
    const { user, hasPermiso } = useAuth()
    const { settings } = useConfig()
    const { isOnline } = useOnlineStatus()
    const { productos, loading, fetchProductos } = useProductos()
    const { ventas, agregarVenta, pendingSyncCount, syncOfflineSales } = useVentas()
    const { cajaActual } = useCierreCaja()
    const cart = useCart({
        itbisEnabled: settings.itbisEnabled,
        itbisRate: settings.itbisRate,
        propinaEnabled: settings.propinaEnabled,
        propinaRate: settings.propinaRate
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [showCheckout, setShowCheckout] = useState(false)
    const [completedVenta, setCompletedVenta] = useState<Venta | null>(null)
    const [discountInput, setDiscountInput] = useState('')
    const [showCart, setShowCart] = useState(false) // Mobile cart toggle
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Sync tax settings from config
    useEffect(() => {
        cart.setTaxConfig({
            itbisEnabled: settings.itbisEnabled,
            itbisRate: settings.itbisRate,
            propinaEnabled: settings.propinaEnabled,
            propinaRate: settings.propinaRate
        })
    }, [settings.itbisEnabled, settings.itbisRate, settings.propinaEnabled, settings.propinaRate])

    // Barcode Scanner Hook
    useBarcodeScan((barcode) => {
        setSearchTerm(barcode)
        // Auto-submit search when scan detects completion
        const scannedProduct = productos.find(p => p.codigoBarra === barcode && p.activo && p.stock > 0)

        if (scannedProduct) {
            handleAddToCart(scannedProduct)
            setSearchTerm('') // Clear after successful add
            // Toast or sound could go here
        }
    })

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm) return

        // Check for exact barcode match
        const exactMatch = productos.find(p => p.codigoBarra === searchTerm && p.activo && p.stock > 0)

        if (exactMatch) {
            handleAddToCart(exactMatch)
            setSearchTerm('') // Clear after add
        }
    }

    const filteredProductos = useMemo(() => {
        if (!searchTerm.trim()) return productos.filter(p => p.activo && p.stock > 0)
        const term = searchTerm.toLowerCase()
        return productos.filter(
            p => p.activo && p.stock > 0 && (
                p.nombre.toLowerCase().includes(term) ||
                p.categoria.toLowerCase().includes(term) ||
                (p.codigoBarra && p.codigoBarra.includes(term)) || // Partial match for code too?
                (p.talla && p.talla.toLowerCase().includes(term)) ||
                (p.color && p.color.toLowerCase().includes(term))
            )
        )
    }, [productos, searchTerm])

    const handleAddToCart = (producto: Producto) => {
        // Calculate total quantity of THIS specific variant/SKU in cart
        // (Since Flat SKU, product ID is unique for this variant)
        const currentInCart = cart.items.find(item => item.producto.id === producto.id)?.cantidad || 0

        if (currentInCart + 1 > producto.stock) {
            alert(`Stock insuficiente.\n\nDisponible: ${producto.stock}\nEn carrito: ${currentInCart}`)
            return
        }

        cart.addToCart(producto)
    }

    const handleCheckout = async (metodoPago: 'efectivo' | 'tarjeta' | 'transferencia', recibio?: number, cambio?: number) => {
        try {
            // Construct sale object manually to avoid clearing cart before success
            const venta: Venta = {
                id: '', // Will be set by Firestore
                items: [...cart.items],
                subtotal: cart.subtotal,
                descuento: cart.descuento,
                impuesto: cart.impuesto,
                propina: cart.propina,
                total: cart.total,
                metodoPago,
                vendedor: user?.nombre || 'Vendedor',
                cajaId: cajaActual?.id,
                cliente: 'Cliente General',
                tenantId: user?.tenantId || 'default', // Multi-tenant
                fecha: new Date(),
                estado: 'completada',
                itbisAplicado: cart.itbisEnabled,
                propinaAplicada: cart.propinaEnabled,
                ...(recibio !== undefined && { montoRecibido: recibio }),
                ...(cambio !== undefined && { cambio: cambio })
            }

            // Final safety check
            if (!cajaActual) {
                throw new Error("No se puede procesar la venta: La caja está cerrada.")
            }

            // 1. Process sale (handles offline queue automatically)
            const result = await agregarVenta(venta)
            const isOfflineSale = result === 'offline-queued'
            const savedId = isOfflineSale ? `offline-${Date.now()}` : result as string

            // 2. Only clear cart if successful
            cart.clearCart()

            // 3. Refresh product list to show updated stock
            await fetchProductos()

            setShowCheckout(false)
            setCompletedVenta({ ...venta, id: savedId })
        } catch (error) {
            console.error("Error saving sale:", error)
            alert(error instanceof Error ? error.message : "Error al procesar la venta")
        }
    }

    const handleApplyDiscount = () => {
        const discount = parseFloat(discountInput)
        if (!isNaN(discount)) {
            cart.setDescuento(discount)
        }
        setDiscountInput('')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-48px)] flex flex-col lg:flex-row gap-4 p-2 sm:p-0">
            {/* Products Panel */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <span className="hidden sm:inline">Punto de Venta</span>
                        <span className="sm:hidden">POS</span>
                    </h1>

                    <div className="flex items-center gap-2">
                        {/* Status Connection */}
                        <Badge
                            variant={isOnline ? "outline" : "destructive"}
                            className={cn(
                                "gap-1 py-1 px-3 border-2 transition-all duration-300",
                                isOnline ? "text-green-600 border-green-200" : "animate-pulse"
                            )}
                        >
                            {isOnline ? (
                                <><Wifi className="h-3 w-3" /> <span className="text-[10px] sm:text-xs">Online</span></>
                            ) : (
                                <><WifiOff className="h-3 w-3" /> <span className="text-[10px] sm:text-xs">Offline</span></>
                            )}
                        </Badge>

                        {pendingSyncCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="gap-1 py-1 px-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
                                onClick={() => syncOfflineSales()}
                            >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-[10px] sm:text-xs">{pendingSyncCount} Pendientes</span>
                            </Badge>
                        )}

                        {/* Mobile cart toggle */}
                        <Button
                            variant="outline"
                            className="lg:hidden relative"
                            onClick={() => setShowCart(!showCart)}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {cart.items.length > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {cart.items.length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative mb-3 sm:mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Buscar producto o escanear código de barras..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 text-sm"
                        autoComplete="off"
                    />
                    <Button type="submit" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0">
                        <Barcode className="h-4 w-4" />
                    </Button>
                </form>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                        {filteredProductos.map((producto) => (
                            <Card
                                key={producto.id}
                                className="cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => handleAddToCart(producto)}
                            >
                                <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                                    <ProductImage src={producto.imagen} alt={producto.nombre} />
                                    <Badge className="absolute top-1 right-1 text-[10px] sm:text-xs" variant={producto.stock <= 5 ? 'warning' : 'success'}>
                                        {producto.stock}
                                    </Badge>
                                    {/* Show size/color badge */}
                                    <div className="absolute bottom-1 left-1 flex gap-1">
                                        {producto.talla && (
                                            <Badge variant="secondary" className="text-[10px] px-1 h-5 bg-black/50 text-white hover:bg-black/70 border-none">
                                                {producto.talla}
                                            </Badge>
                                        )}
                                        {producto.color && (
                                            <Badge variant="secondary" className="text-[10px] px-1 h-5 bg-black/50 text-white hover:bg-black/70 border-none">
                                                {producto.color}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-2 sm:p-3">
                                    <p className="font-medium text-xs sm:text-sm truncate">{producto.nombre}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-primary font-bold text-sm sm:text-base">{formatCurrency(producto.precio)}</p>
                                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                            {producto.codigoBarra?.slice(-4) || '---'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredProductos.length === 0 && (
                        <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
                            No se encontraron productos
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Panel - Desktop */}
            <Card className={`w-full lg:w-80 xl:w-96 flex flex-col ${showCart ? 'fixed inset-0 z-50 rounded-none lg:relative lg:rounded-lg' : 'hidden lg:flex'}`}>
                <CardHeader className="pb-2 sm:pb-3 flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                        Carrito
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {cart.items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cart.clearCart}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden h-8 w-8 p-0"
                            onClick={() => setShowCart(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 p-3 sm:p-4">
                    {cart.items.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground">
                            <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.items.map((item) => (
                            <div key={item.cartItemId} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs sm:text-sm truncate">{item.producto.nombre}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {item.producto.talla} / {item.producto.color} <span className="font-mono ml-1">[{item.producto.codigoBarra}]</span>
                                    </p>
                                    <p className="text-primary font-semibold text-xs sm:text-sm">
                                        {formatCurrency(item.subtotal)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7"
                                        onClick={() => cart.updateQuantity(item.cartItemId, item.cantidad - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    {(() => {
                                        const atMaxStock = item.cantidad >= item.producto.stock
                                        return (
                                            <>
                                                <span className={`w-6 sm:w-8 text-center font-medium text-xs sm:text-sm ${atMaxStock ? 'text-orange-500' : ''}`}>
                                                    {item.cantidad}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 sm:h-7 sm:w-7"
                                                    onClick={() => {
                                                        if (item.cantidad < item.producto.stock) {
                                                            cart.updateQuantity(item.cartItemId, item.cantidad + 1)
                                                        }
                                                    }}
                                                    disabled={atMaxStock}
                                                    title={atMaxStock ? `Stock máximo: ${item.producto.stock}` : ''}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )
                                    })()}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 text-destructive"
                                        onClick={() => cart.removeFromCart(item.cartItemId)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>

                {cart.items.length > 0 && (
                    <div className="p-3 sm:p-4 border-t space-y-2 sm:space-y-3">
                        {/* Discount */}
                        {hasPermiso('pos:descuentos') && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="% Desc."
                                    value={discountInput}
                                    onChange={(e) => setDiscountInput(e.target.value)}
                                    className="flex-1 text-sm h-9"
                                    type="number"
                                    min="0"
                                    max="100"
                                />
                                <Button variant="outline" onClick={handleApplyDiscount} className="h-9 text-sm px-3">
                                    Aplicar
                                </Button>
                            </div>
                        )}

                        {/* Tax toggles for this sale */}
                        {hasPermiso('pos:toggle_impuesto') && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cart.itbisEnabled}
                                            onChange={(e) => cart.setItbisEnabled(e.target.checked)}
                                            className="rounded border-border"
                                        />
                                        <span>ITBIS ({settings.itbisRate}%)</span>
                                    </label>
                                    {cart.itbisEnabled && <span>{formatCurrency(cart.impuesto)}</span>}
                                </div>

                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cart.propinaEnabled}
                                            onChange={(e) => cart.setPropinaEnabled(e.target.checked)}
                                            className="rounded border-border"
                                        />
                                        <span>Propina ({settings.propinaRate}%)</span>
                                    </label>
                                    {cart.propinaEnabled && <span>{formatCurrency(cart.propina)}</span>}
                                </div>
                            </div>
                        )}

                        {/* Totals */}
                        <div className="space-y-1 text-xs sm:text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            {cart.descuento > 0 && (
                                <div className="flex justify-between text-green-500">
                                    <span>Descuento:</span>
                                    <span>-{formatCurrency(cart.descuento)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-base sm:text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrency(cart.total)}</span>
                            </div>
                        </div>

                        {/* Cash Drawer Warning */}
                        {!cajaActual && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-600 dark:text-orange-400 text-xs flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 shrink-0" />
                                <span>Caja cerrada. Abra la caja para realizar ventas.</span>
                            </div>
                        )}

                        {/* Checkout Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setShowCheckout(true)}
                            disabled={!cajaActual}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {!cajaActual ? 'Caja Cerrada' : 'Procesar Pago'}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Modals */}

            <CheckoutModal
                open={showCheckout}
                onClose={() => setShowCheckout(false)}
                total={cart.total}
                onCheckout={handleCheckout}
            />

            <SaleCompleteModal
                open={!!completedVenta}
                onClose={() => setCompletedVenta(null)}
                venta={completedVenta}
                settings={settings}
            />
        </div>
    )
}

