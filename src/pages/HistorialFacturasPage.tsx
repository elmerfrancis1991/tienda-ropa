import { useState, useMemo } from 'react'
import { downloadCSV } from '@/lib/csv-helper'
import {
    FileText,
    Search,
    Calendar,
    Download,
    Eye,
    Printer,
    Filter,
    ChevronLeft,
    ChevronRight,
    Receipt,
    DollarSign,
    ShoppingCart,
    User,
    Clock,
    Loader2,
    X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency, cn } from '@/lib/utils'
import { useVentas } from '@/hooks/useVentas'
import { Venta } from '@/hooks/useCart'
import { useConfig } from '@/contexts/ConfigContext'
import { printTicket } from '@/lib/printer'

const ITEMS_PER_PAGE = 10

export default function HistorialFacturasPage() {
    const { ventas, loading } = useVentas()
    const { settings } = useConfig()
    const [searchTerm, setSearchTerm] = useState('')
    const [dateFilter, setDateFilter] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('todo')
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    // Filtrar ventas
    const filteredVentas = useMemo(() => {
        let filtered = [...ventas]

        // Filtro por término de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase().replace('#', '') // Remove # if user includes it
            filtered = filtered.filter(v => {
                // Match full ID or shortened ID (last 8 chars)
                const shortId = v.id.slice(-8).toLowerCase()
                return v.id.toLowerCase().includes(term) ||
                    shortId.includes(term) ||
                    (v.cliente?.toLowerCase().includes(term)) ||
                    v.items.some(item => item.producto.nombre.toLowerCase().includes(term))
            })
        }

        // Filtro por fecha (Ultra-robusto)
        const now = new Date()

        if (dateFilter === 'hoy') {
            const startOfToday = new Date(now)
            startOfToday.setHours(0, 0, 0, 0)
            const endOfToday = new Date(now)
            endOfToday.setHours(23, 59, 59, 999)

            filtered = filtered.filter(v => {
                const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha)
                return fecha >= startOfToday && fecha <= endOfToday
            })
        } else if (dateFilter === 'semana') {
            const startOfWeek = new Date(now)
            const day = startOfWeek.getDay()
            const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1) // Lunes
            startOfWeek.setDate(diff)
            startOfWeek.setHours(0, 0, 0, 0)

            filtered = filtered.filter(v => {
                const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha)
                return fecha >= startOfWeek && fecha <= now
            })
        } else if (dateFilter === 'mes') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
            filtered = filtered.filter(v => {
                const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha)
                return fecha >= startOfMonth && fecha <= now
            })
        }

        return filtered.sort((a, b) => {
            const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha)
            const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha)
            return fechaB.getTime() - fechaA.getTime()
        })
    }, [ventas, searchTerm, dateFilter])

    // Paginación
    const totalPages = Math.ceil(filteredVentas.length / ITEMS_PER_PAGE)
    const paginatedVentas = filteredVentas.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Estadísticas
    const stats = useMemo(() => {
        const total = filteredVentas.reduce((sum, v) => sum + v.total, 0)
        const transacciones = filteredVentas.length
        const promedioTicket = transacciones > 0 ? total / transacciones : 0
        return { total, transacciones, promedioTicket }
    }, [filteredVentas])

    const handlePrint = (venta: Venta) => {
        printTicket(venta, {
            businessName: settings.businessName,
            rnc: settings.rnc,
            direccion: settings.direccion,
            telefono: settings.telefono,
            email: settings.email,
        })
    }

    const handleExportCSV = () => {
        const headers = ['ID Factura', 'Fecha', 'Cliente', 'Productos', 'Subtotal', 'Descuento', 'ITBIS', 'Total', 'Método Pago']
        const rows = filteredVentas.map(v => {
            const fecha = v.fecha instanceof Date ? v.fecha : new Date(v.fecha)
            return [
                v.id,
                fecha.toLocaleString(),
                v.cliente || 'Cliente General',
                v.items.map(i => `${i.cantidad}x ${i.producto.nombre}`).join('; '),
                v.subtotal.toFixed(2),
                v.descuento.toFixed(2),
                v.impuesto.toFixed(2),
                v.total.toFixed(2),
                v.metodoPago
            ]
        })

        downloadCSV(`historial_facturas_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
    }

    const formatDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date)
        return new Intl.DateTimeFormat('es-DO', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(d)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando historial...</p>
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
                        <FileText className="h-8 w-8 text-primary" />
                        Historial de Facturas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Auditoría y consulta de todas las transacciones
                    </p>
                </div>
                <Button onClick={handleExportCSV} disabled={filteredVentas.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Total Ventas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-500" />
                            Transacciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.transacciones}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-purple-500" />
                            Ticket Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.promedioTicket)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por ID, cliente o producto..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex p-1 bg-muted rounded-lg">
                            {(['hoy', 'semana', 'mes', 'todo'] as const).map((periodo) => (
                                <button
                                    key={periodo}
                                    onClick={() => {
                                        setDateFilter(periodo)
                                        setCurrentPage(1)
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                        dateFilter === periodo
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Todo'}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices List */}
            <div className="space-y-3">
                {paginatedVentas.length > 0 ? (
                    paginatedVentas.map((venta) => {
                        const fecha = venta.fecha instanceof Date ? venta.fecha : new Date(venta.fecha)
                        return (
                            <Card key={venta.id} className="hover:border-primary/30 transition-colors">
                                <CardContent className="py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                                    #{venta.id.slice(-8).toUpperCase()}
                                                </span>
                                                <Badge variant={venta.metodoPago === 'efectivo' ? 'default' : 'secondary'}>
                                                    {venta.metodoPago}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(fecha)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {venta.cliente || 'Cliente General'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ShoppingCart className="h-3 w-3" />
                                                    {venta.items.reduce((sum, i) => sum + i.cantidad, 0)} productos
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-primary">
                                                    {formatCurrency(venta.total)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedVenta(venta)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handlePrint(venta)}
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-lg">No hay facturas</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchTerm || dateFilter !== 'todo'
                                    ? 'No se encontraron facturas con los filtros aplicados'
                                    : 'Aún no hay transacciones registradas'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVentas.length)} de {filteredVentas.length}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedVenta} onOpenChange={() => setSelectedVenta(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            Detalle de Factura
                        </DialogTitle>
                        <DialogDescription>
                            #{selectedVenta?.id.slice(-8).toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedVenta && (
                        <div className="space-y-4">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Fecha</p>
                                    <p className="font-medium">{formatDate(selectedVenta.fecha)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Cliente</p>
                                    <p className="font-medium">{selectedVenta.cliente || 'Cliente General'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Método de Pago</p>
                                    <Badge>{selectedVenta.metodoPago}</Badge>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted px-4 py-2 text-sm font-medium">
                                    Productos
                                </div>
                                <div className="divide-y">
                                    {selectedVenta.items.map((item, idx) => (
                                        <div key={idx} className="px-4 py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.producto.nombre}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.cantidad} x {formatCurrency(item.producto.precio)}
                                                    {item.producto.talla && ` • Talla: ${item.producto.talla}`}
                                                    {item.producto.color && ` • ${item.producto.color}`}
                                                </p>
                                            </div>
                                            <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedVenta.subtotal)}</span>
                                </div>
                                {selectedVenta.descuento > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Descuento</span>
                                        <span>-{formatCurrency(selectedVenta.descuento)}</span>
                                    </div>
                                )}
                                {selectedVenta.impuesto > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>ITBIS (18%)</span>
                                        <span>{formatCurrency(selectedVenta.impuesto)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">{formatCurrency(selectedVenta.total)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1" onClick={() => handlePrint(selectedVenta)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Reimprimir
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedVenta(null)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
