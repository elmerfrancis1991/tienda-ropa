import { useState, useMemo } from 'react'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Loader2,
    Filter,
    AlertTriangle,
    XCircle,
    BarChart3,
    Minus,
} from 'lucide-react'
import { useProductos } from '@/hooks/useProductos'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { ProductoForm } from './ProductoForm'
import { Producto, CATEGORIAS_ROPA, STOCK_MINIMO_DEFAULT } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'

export default function ProductosPage() {
    const { user } = useAuth()
    const { productos, loading, error, addProducto, updateProducto, deleteProducto } = useProductos()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategoria, setSelectedCategoria] = useState<string>('')
    const [stockFilter, setStockFilter] = useState<'todos' | 'bajo' | 'agotado'>('todos')
    const [formOpen, setFormOpen] = useState(false)
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null)

    // Stock adjustment modal
    const [stockModalOpen, setStockModalOpen] = useState(false)
    const [stockProducto, setStockProducto] = useState<Producto | null>(null)
    const [stockAjuste, setStockAjuste] = useState('')
    const [tipoAjuste, setTipoAjuste] = useState<'agregar' | 'restar'>('agregar')
    const [isAjustando, setIsAjustando] = useState(false)

    // Estadísticas de inventario
    const stats = useMemo(() => ({
        total: productos.length,
        enStock: productos.reduce((sum, p) => sum + p.stock, 0),
        agotados: productos.filter(p => p.stock === 0).length,
        stockBajo: productos.filter(p => p.stock > 0 && p.stock <= STOCK_MINIMO_DEFAULT).length,
        valorInventario: productos.reduce((sum, p) => sum + (p.precio * p.stock), 0)
    }), [productos])

    // Alertas de inventario
    const alertas = useMemo(() => {
        return productos
            .filter(p => p.stock <= STOCK_MINIMO_DEFAULT)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
    }, [productos])

    const filteredProductos = useMemo(() => {
        return productos.filter((p) => {
            const matchesSearch =
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategoria = !selectedCategoria || p.categoria === selectedCategoria
            const matchesStock = stockFilter === 'todos'
                || (stockFilter === 'bajo' && p.stock > 0 && p.stock <= STOCK_MINIMO_DEFAULT)
                || (stockFilter === 'agotado' && p.stock === 0)
            return matchesSearch && matchesCategoria && matchesStock
        })
    }, [productos, searchTerm, selectedCategoria, stockFilter])

    const handleCreateProducto = async (data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
        await addProducto(data)
    }

    const handleUpdateProducto = async (data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingProducto) {
            await updateProducto(editingProducto.id, data)
            setEditingProducto(null)
        }
    }

    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProducto(productToDelete.id)
            setProductToDelete(null)
            setDeleteDialogOpen(false)
        }
    }

    const handleAjustarStock = async () => {
        if (!stockProducto) return
        const cantidad = parseInt(stockAjuste)
        if (isNaN(cantidad) || cantidad <= 0) return

        setIsAjustando(true)
        try {
            const nuevoStock = tipoAjuste === 'agregar'
                ? stockProducto.stock + cantidad
                : Math.max(0, stockProducto.stock - cantidad)
            await updateProducto(stockProducto.id, { stock: nuevoStock })
            setStockModalOpen(false)
            setStockAjuste('')
            setStockProducto(null)
        } catch (err) {
            console.error('Error adjusting stock:', err)
        } finally {
            setIsAjustando(false)
        }
    }

    const openEditForm = (producto: Producto) => {
        setEditingProducto(producto)
        setFormOpen(true)
    }

    const openDeleteDialog = (producto: Producto) => {
        setProductToDelete(producto)
        setDeleteDialogOpen(true)
    }

    const openStockModal = (producto: Producto) => {
        setStockProducto(producto)
        setStockAjuste('')
        setTipoAjuste('agregar')
        setStockModalOpen(true)
    }

    const closeForm = () => {
        setFormOpen(false)
        setEditingProducto(null)
    }

    const getCategoriaName = (id: string) => {
        return CATEGORIAS_ROPA.find((c) => c.id === id)?.nombre || id
    }

    const getStockBadge = (stock: number) => {
        if (stock === 0) return <Badge variant="destructive">Agotado</Badge>
        if (stock <= STOCK_MINIMO_DEFAULT) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Bajo</Badge>
        return <Badge variant="secondary">{stock}</Badge>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando productos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-8 w-8 text-primary" />
                        Productos e Inventario
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona el catálogo y control de stock
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <Button onClick={() => setFormOpen(true)} className="shrink-0">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
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
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Unidades en Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.enStock}</div>
                    </CardContent>
                </Card>
                <Card className={stats.agotados > 0 ? "border-red-500/50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Agotados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.agotados}</div>
                    </CardContent>
                </Card>
                <Card className={stats.stockBajo > 0 ? "border-yellow-500/50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            Stock Bajo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{stats.stockBajo}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <BarChart3 className="h-3 w-3 text-green-500" />
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
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            Alertas de Stock ({alertas.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {alertas.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => openStockModal(p)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                        p.stock === 0
                                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    )}
                                >
                                    {p.nombre}: {p.stock === 0 ? 'Sin stock' : `${p.stock} unid.`}
                                </button>
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
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={selectedCategoria}
                            onChange={(e) => setSelectedCategoria(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
                        >
                            <option value="">Categoría</option>
                            {CATEGORIAS_ROPA.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                        <div className="flex p-1 bg-muted rounded-lg">
                            {(['todos', 'bajo', 'agotado'] as const).map((tipo) => (
                                <button
                                    key={tipo}
                                    onClick={() => setStockFilter(tipo)}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                        stockFilter === tipo
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tipo === 'todos' ? 'Todos' : tipo === 'bajo' ? 'Bajo Stock' : 'Agotados'}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProductos.map((producto) => (
                    <Card key={producto.id} className={cn(
                        "overflow-hidden group",
                        producto.stock === 0 && "border-red-500/30",
                        producto.stock > 0 && producto.stock <= STOCK_MINIMO_DEFAULT && "border-yellow-500/30"
                    )}>
                        <div className="aspect-square relative bg-muted">
                            {producto.imagen ? (
                                <img
                                    src={producto.imagen}
                                    alt={producto.nombre}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-16 w-16 text-muted-foreground/50" />
                                </div>
                            )}
                            {user?.role === 'admin' && (
                                <>
                                    <Button size="sm" variant="secondary" onClick={() => openEditForm(producto)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => openStockModal(producto)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(producto)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold line-clamp-1">{producto.nombre}</h3>
                                    {getStockBadge(producto.stock)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <Badge variant="outline">{getCategoriaName(producto.categoria)}</Badge>
                                    <span className="font-bold text-primary">
                                        {formatCurrency(producto.precio)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty state */}
            {filteredProductos.length === 0 && !loading && (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">No se encontraron productos</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchTerm || selectedCategoria || stockFilter !== 'todos'
                                ? 'Intenta con otros filtros de búsqueda'
                                : 'Comienza agregando tu primer producto'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Product Form Modal */}
            <ProductoForm
                open={formOpen}
                onClose={closeForm}
                onSubmit={editingProducto ? handleUpdateProducto : handleCreateProducto}
                producto={editingProducto}
            />

            {/* Stock Adjustment Modal */}
            <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajustar Stock</DialogTitle>
                        <DialogDescription>{stockProducto?.nombre}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <span>Stock Actual:</span>
                            <span className="text-2xl font-bold">{stockProducto?.stock || 0}</span>
                        </div>
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
                        </div>
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={stockAjuste}
                                onChange={(e) => setStockAjuste(e.target.value)}
                            />
                        </div>
                        {stockAjuste && stockProducto && (
                            <div className="p-3 bg-primary/10 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Nuevo stock:</p>
                                <p className="text-2xl font-bold text-primary">
                                    {tipoAjuste === 'agregar'
                                        ? stockProducto.stock + parseInt(stockAjuste || '0')
                                        : Math.max(0, stockProducto.stock - parseInt(stockAjuste || '0'))
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStockModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAjustarStock} disabled={isAjustando || !stockAjuste}>
                            {isAjustando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar producto?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. El producto{' '}
                            <strong>{productToDelete?.nombre}</strong> será eliminado
                            permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
