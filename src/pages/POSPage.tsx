import { useState, useMemo, useEffect } from 'react'
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
} from 'lucide-react'
import { printTicket } from '@/lib/printer'
import { useProductos } from '@/hooks/useProductos'
import { useCart, Venta } from '@/hooks/useCart'
import { useVentas } from '@/hooks/useVentas'
import { useCierreCaja } from '@/hooks/useCierreCaja'
import { useAuth } from '@/contexts/AuthContext'
import { useConfig } from '@/contexts/ConfigContext'
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
import { formatCurrency } from '@/lib/utils'

interface ProductSelectModalProps {
    producto: Producto | null
    open: boolean
    onClose: () => void
    onAdd: (producto: Producto, talla: string, color: string) => void
}

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

function ProductSelectModal({ producto, open, onClose, onAdd }: ProductSelectModalProps) {
    const [selectedTalla, setSelectedTalla] = useState<string>('')
    const [selectedColor, setSelectedColor] = useState<string>('')

    if (!producto) return null

    const handleAdd = () => {
        if (selectedTalla && selectedColor) {
            onAdd(producto, selectedTalla, selectedColor)
            setSelectedTalla('')
            setSelectedColor('')
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Seleccionar Variante</DialogTitle>
                    <DialogDescription className="text-sm">{producto.nombre}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">Talla *</p>
                        <div className="flex flex-wrap gap-2">
                            {producto.tallas.map((talla) => (
                                <Badge
                                    key={talla}
                                    variant={selectedTalla === talla ? 'default' : 'outline'}
                                    className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3 py-1"
                                    onClick={() => setSelectedTalla(talla)}
                                >
                                    {talla}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-2">Color *</p>
                        <div className="flex flex-wrap gap-2">
                            {producto.colores.map((color) => (
                                <Badge
                                    key={color}
                                    variant={selectedColor === color ? 'default' : 'outline'}
                                    className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3 py-1"
                                    onClick={() => setSelectedColor(color)}
                                >
                                    {color}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                            {formatCurrency(producto.precio)}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button onClick={handleAdd} disabled={!selectedTalla || !selectedColor} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface CheckoutModalProps {
    open: boolean
    onClose: () => void
    total: number
    onCheckout: (metodo: 'efectivo' | 'tarjeta' | 'transferencia') => void
}

function CheckoutModal({ open, onClose, total, onCheckout }: CheckoutModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | null>(null)
    const [processing, setProcessing] = useState(false)

    const handleCheckout = async () => {
        if (!selectedMethod) return
        setProcessing(true)
        // Simulate processing time but logic is handled by parent
        await onCheckout(selectedMethod)
        setProcessing(false)
        setSelectedMethod(null)
    }

    const paymentMethods = [
        { id: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
        { id: 'tarjeta' as const, label: 'Tarjeta', icon: CreditCard },
        { id: 'transferencia' as const, label: 'Transfer.', icon: Building2 },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
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
                                onClick={() => setSelectedMethod(method.id)}
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
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} disabled={processing} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button onClick={handleCheckout} disabled={!selectedMethod || processing} className="w-full sm:w-auto">
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar
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

    const handlePrint = () => {
        printTicket(venta, {
            businessName: settings.businessName,
            rnc: settings.rnc,
            direccion: settings.direccion,
            telefono: settings.telefono,
            email: settings.email
        })
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
    const { user } = useAuth()
    const { settings } = useConfig()
    const { productos, loading } = useProductos()
    const { procesarVenta } = useVentas()
    const { cajaActual } = useCierreCaja()
    const cart = useCart({
        itbisEnabled: settings.itbisEnabled,
        itbisRate: settings.itbisRate,
        propinaEnabled: settings.propinaEnabled,
        propinaRate: settings.propinaRate
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [showCheckout, setShowCheckout] = useState(false)
    const [completedVenta, setCompletedVenta] = useState<Venta | null>(null)
    const [discountInput, setDiscountInput] = useState('')
    const [showCart, setShowCart] = useState(false) // Mobile cart toggle

    // Sync tax settings from config
    useEffect(() => {
        cart.setTaxConfig({
            itbisEnabled: settings.itbisEnabled,
            itbisRate: settings.itbisRate,
            propinaEnabled: settings.propinaEnabled,
            propinaRate: settings.propinaRate
        })
    }, [settings.itbisEnabled, settings.itbisRate, settings.propinaEnabled, settings.propinaRate])

    const filteredProductos = useMemo(() => {
        if (!searchTerm.trim()) return productos.filter(p => p.activo && p.stock > 0)
        const term = searchTerm.toLowerCase()
        return productos.filter(
            p => p.activo && p.stock > 0 && (
                p.nombre.toLowerCase().includes(term) ||
                p.categoria.toLowerCase().includes(term)
            )
        )
    }, [productos, searchTerm])

    const handleAddToCart = (producto: Producto, talla: string, color: string) => {
        // Check current quantity in cart
        const currentItem = cart.items.find(
            item => item.producto.id === producto.id && item.talla === talla && item.color === color
        )
        const currentQty = currentItem?.cantidad || 0

        if (currentQty + 1 > producto.stock) {
            alert(`No hay suficiente stock disponible. Stock actual: ${producto.stock}`)
            return
        }

        cart.addToCart(producto, talla, color)
    }



    const handleCheckout = async (metodoPago: 'efectivo' | 'tarjeta' | 'transferencia') => {
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
                fecha: new Date(),
                estado: 'completada',
                itbisAplicado: cart.itbisEnabled,
                propinaAplicada: cart.propinaEnabled
            }

            // 1. Process sale atomically in Firebase
            await procesarVenta(venta)

            // 2. Only clear cart if successful
            cart.clearCart()

            setShowCheckout(false)
            setCompletedVenta(venta)
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

                {/* Search */}
                <div className="relative mb-3 sm:mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                        {filteredProductos.map((producto) => (
                            <Card
                                key={producto.id}
                                className="cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => setSelectedProducto(producto)}
                            >
                                <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                                    <ProductImage src={producto.imagen} alt={producto.nombre} />
                                    <Badge className="absolute top-1 right-1 text-[10px] sm:text-xs" variant={producto.stock <= 5 ? 'warning' : 'success'}>
                                        {producto.stock}
                                    </Badge>
                                </div>
                                <CardContent className="p-2 sm:p-3">
                                    <p className="font-medium text-xs sm:text-sm truncate">{producto.nombre}</p>
                                    <p className="text-primary font-bold text-sm sm:text-base">{formatCurrency(producto.precio)}</p>
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
                        cart.items.map((item, index) => (
                            <div key={index} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs sm:text-sm truncate">{item.producto.nombre}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {item.talla} / {item.color}
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
                                        onClick={() => cart.updateQuantity(index, item.cantidad - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 sm:w-8 text-center font-medium text-xs sm:text-sm">{item.cantidad}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7"
                                        onClick={() => cart.updateQuantity(index, item.cantidad + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 text-destructive"
                                        onClick={() => cart.removeFromCart(index)}
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

                        {/* Tax toggles for this sale */}
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

                        {/* Checkout Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setShowCheckout(true)}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Procesar Pago
                        </Button>
                    </div>
                )}
            </Card>

            {/* Modals */}
            <ProductSelectModal
                producto={selectedProducto}
                open={!!selectedProducto}
                onClose={() => setSelectedProducto(null)}
                onAdd={handleAddToCart}
            />

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
