import { useState, useMemo } from 'react'
import {
    Package,
    AlertTriangle,
    Search,
    Filter,
    TrendingDown,
    TrendingUp,
    Edit,
    Plus,
    Minus,
    Loader2,
    XCircle,
    CheckCircle2,
    BarChart3,
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
import { useProductos } from '@/hooks/useProductos'
import { Producto, STOCK_MINIMO_DEFAULT, AlertaInventario } from '@/types'

export default function InventarioPage() {
    const { productos, loading, updateProducto } = useProductos()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'todos' | 'bajo' | 'agotado' | 'normal'>('todos')
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [ajusteStock, setAjusteStock] = useState('')
    const [tipoAjuste, setTipoAjuste] = useState<'agregar' | 'restar' | 'establecer'>('agregar')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Generar alertas de inventario
    const alertas: AlertaInventario[] = useMemo(() => {
        return productos
            .filter(p => p.stock <= STOCK_MINIMO_DEFAULT)
            .map(p => ({
                productoId: p.id,
                productoNombre: p.nombre,
                stockActual: p.stock,
                stockMinimo: STOCK_MINIMO_DEFAULT,
                tipo: (p.stock === 0 ? 'agotado' : 'bajo') as 'bajo' | 'agotado'
            }))
            .sort((a, b) => a.stockActual - b.stockActual)
    }, [productos])

    // Estadísticas
    const stats = useMemo(() => ({
        total: productos.length,
        agotados: productos.filter(p => p.stock === 0).length,
        stockBajo: productos.filter(p => p.stock > 0 && p.stock <= STOCK_MINIMO_DEFAULT).length,
        valorInventario: productos.reduce((sum, p) => sum + (p.precio * p.stock), 0)
    }), [productos])

    // Filtrar productos
    const filteredProductos = useMemo(() => {
        let filtered = [...productos]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                p.categoria.toLowerCase().includes(term)
            )
        }

        if (filterType === 'bajo') {
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= STOCK_MINIMO_DEFAULT)
        } else if (filterType === 'agotado') {
            filtered = filtered.filter(p => p.stock === 0)
        } else if (filterType === 'normal') {
            filtered = filtered.filter(p => p.stock > STOCK_MINIMO_DEFAULT)
        }

        return filtered.sort((a, b) => a.stock - b.stock)
    }, [productos, searchTerm, filterType])

    // Ajustar stock
    const handleAjustarStock = async () => {
        if (!selectedProducto) return

        const cantidad = parseInt(ajusteStock)
        if (isNaN(cantidad) || cantidad < 0) {
            setError('Ingrese una cantidad válida')
            return
        }

        let nuevoStock: number
        if (tipoAjuste === 'agregar') {
            nuevoStock = selectedProducto.stock + cantidad
        } else if (tipoAjuste === 'restar') {
            nuevoStock = Math.max(0, selectedProducto.stock - cantidad)
        } else {
            nuevoStock = cantidad
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await updateProducto(selectedProducto.id, { stock: nuevoStock })
            setSelectedProducto(null)
            setAjusteStock('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al ajustar stock')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStockBadge = (stock: number) => {
        if (stock === 0) {
            return <Badge variant="destructive">Agotado</Badge>
        } else if (stock <= STOCK_MINIMO_DEFAULT) {
            return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Stock Bajo</Badge>
        }
        return <Badge variant="secondary">{stock} unidades</Badge>
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Package className="h-8 w-8 text-primary" />
                    Gestión de Inventario
                </h1>
                <p className="text-muted-foreground mt-1">
                    Control de stock y alertas de inventario
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Productos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className={stats.agotados > 0 ? "border-red-500/50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Agotados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.agotados}</div>
                    </CardContent>
                </Card>
                <Card className={stats.stockBajo > 0 ? "border-yellow-500/50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Stock Bajo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{stats.stockBajo}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-500" />
                            Valor Inventario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorInventario)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="h-5 w-5" />
                            Alertas de Inventario ({alertas.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {alertas.slice(0, 6).map(alerta => (
                                <div
                                    key={alerta.productoId}
                                    className={cn(
                                        "p-3 rounded-lg border flex items-center justify-between",
                                        alerta.tipo === 'agotado'
                                            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                            : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                                    )}
                                >
                                    <div>
                                        <p className="font-medium text-sm">{alerta.productoNombre}</p>
                                        <p className={cn(
                                            "text-xs",
                                            alerta.tipo === 'agotado' ? "text-red-600" : "text-yellow-600"
                                        )}>
                                            {alerta.tipo === 'agotado' ? 'Sin stock' : `${alerta.stockActual} unidades`}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const prod = productos.find(p => p.id === alerta.productoId)
                                            if (prod) setSelectedProducto(prod)
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex p-1 bg-muted rounded-lg">
                            {(['todos', 'bajo', 'agotado', 'normal'] as const).map((tipo) => (
                                <button
                                    key={tipo}
                                    onClick={() => setFilterType(tipo)}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                        filterType === tipo
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tipo === 'todos' ? 'Todos' : tipo === 'bajo' ? 'Stock Bajo' : tipo === 'agotado' ? 'Agotados' : 'Normal'}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Products List */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProductos.map(producto => (
                    <Card
                        key={producto.id}
                        className={cn(
                            "cursor-pointer hover:border-primary/50 transition-colors",
                            producto.stock === 0 && "border-red-500/30",
                            producto.stock > 0 && producto.stock <= STOCK_MINIMO_DEFAULT && "border-yellow-500/30"
                        )}
                        onClick={() => setSelectedProducto(producto)}
                    >
                        <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                                {producto.imagen ? (
                                    <img
                                        src={producto.imagen}
                                        alt={producto.nombre}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{producto.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{producto.categoria}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getStockBadge(producto.stock)}
                                        <span className="text-sm text-muted-foreground">
                                            {formatCurrency(producto.precio)}
                                        </span>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProducto(producto)
                                }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredProductos.length === 0 && (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No se encontraron productos</p>
                    </CardContent>
                </Card>
            )}

            {/* Modal Ajustar Stock */}
            <Dialog open={!!selectedProducto} onOpenChange={() => {
                setSelectedProducto(null)
                setAjusteStock('')
                setError(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Ajustar Stock
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProducto?.nombre}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProducto && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <span>Stock Actual:</span>
                                <span className="text-2xl font-bold">{selectedProducto.stock}</span>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Ajuste</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={tipoAjuste === 'agregar' ? 'default' : 'outline'}
                                        onClick={() => setTipoAjuste('agregar')}
                                        className="flex-1"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar
                                    </Button>
                                    <Button
                                        variant={tipoAjuste === 'restar' ? 'default' : 'outline'}
                                        onClick={() => setTipoAjuste('restar')}
                                        className="flex-1"
                                    >
                                        <Minus className="h-4 w-4 mr-2" />
                                        Restar
                                    </Button>
                                    <Button
                                        variant={tipoAjuste === 'establecer' ? 'default' : 'outline'}
                                        onClick={() => setTipoAjuste('establecer')}
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Establecer
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ajusteStock">Cantidad</Label>
                                <Input
                                    id="ajusteStock"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={ajusteStock}
                                    onChange={(e) => setAjusteStock(e.target.value)}
                                />
                            </div>

                            {ajusteStock && (
                                <div className="p-3 bg-primary/10 rounded-lg text-center">
                                    <p className="text-sm text-muted-foreground">Nuevo stock:</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {tipoAjuste === 'agregar'
                                            ? selectedProducto.stock + parseInt(ajusteStock || '0')
                                            : tipoAjuste === 'restar'
                                                ? Math.max(0, selectedProducto.stock - parseInt(ajusteStock || '0'))
                                                : parseInt(ajusteStock || '0')
                                        }
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedProducto(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAjustarStock} disabled={isSubmitting || !ajusteStock}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
