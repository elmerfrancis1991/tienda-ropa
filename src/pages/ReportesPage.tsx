import { useState, useMemo } from 'react'
import { downloadCSV } from '@/lib/csv-helper'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, cn } from '@/lib/utils'
import { useReportes, Periodo } from '@/hooks/useReportes'
import { useVentas } from '@/hooks/useVentas'
import { useProductos } from '@/hooks/useProductos'
import { AnularVentaModal } from '@/components/AnularVentaModal'
import { Venta } from '@/hooks/useCart'
import { useAuth } from '@/contexts/AuthContext'

interface StatCardProps {
    title: string
    value: string
    description: string
    icon: React.ElementType
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function ReportesPage() {
    const { getStatsByPeriod, loading } = useReportes()
    const { anularVenta } = useVentas()
    const { revertirStock } = useProductos()
    const { hasPermiso } = useAuth()

    const [periodo, setPeriodo] = useState<Periodo>('semana')
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
    const [exporting, setExporting] = useState(false)
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
    const [showAnularModal, setShowAnularModal] = useState(false)

    // Calculate detailed date based on selection
    const customDate = useMemo(() => {
        const date = new Date()
        date.setFullYear(parseInt(selectedYear))
        date.setMonth(parseInt(selectedMonth))
        return date
    }, [selectedYear, selectedMonth])

    const filteredData = useMemo(() => getStatsByPeriod(periodo, customDate), [periodo, customDate, getStatsByPeriod])
    const maxChartValue = Math.max(...filteredData.chartData.map(d => d.value), 100)

    const handleExport = async () => {
        setExporting(true)
        await new Promise(resolve => setTimeout(resolve, 1000))

        const headers = ['ID', 'Fecha', 'Cliente', 'Total', 'Metodo', 'Items']
        const rows = filteredData.recentSales.map(v => [
            v.id,
            v.fecha.toLocaleString(),
            v.cliente || 'Consumidor Final',
            v.total,
            v.metodoPago,
            v.items.length
        ])

        downloadCSV(`reporte_ventas_${periodo}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
        setExporting(false)
    }

    const handleAnularClick = (venta: Venta) => {
        setSelectedVenta(venta)
        setShowAnularModal(true)
    }

    const handleConfirmAnulacion = async (motivo: string) => {
        if (!selectedVenta) return
        await anularVenta(selectedVenta.id, motivo, revertirStock)
    }

    const getPeriodoLabel = (p: Periodo): string => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        switch (p) {
            case 'dia': return 'Hoy'
            case 'semana': return 'Esta Semana'
            case 'mes': return `Mes de ${months[parseInt(selectedMonth)]} ${selectedYear}`
            case 'anio': return `Año ${selectedYear}`
            default: return 'Período'
        }
    }

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())
    const months = [
        { value: '0', label: 'Enero' },
        { value: '1', label: 'Febrero' },
        { value: '2', label: 'Marzo' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Mayo' },
        { value: '5', label: 'Junio' },
        { value: '6', label: 'Julio' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Septiembre' },
        { value: '9', label: 'Octubre' },
        { value: '10', label: 'Noviembre' },
        { value: '11', label: 'Diciembre' },
    ]

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
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Reportes
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Análisis de ventas - {getPeriodoLabel(periodo)}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap">
                    {/* Period Selector */}
                    <div className="flex p-1 bg-muted rounded-lg w-full sm:w-auto overflow-x-auto">
                        {(['dia', 'semana', 'mes', 'anio'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriodo(p)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap",
                                    periodo === p
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
                            </button>
                        ))}
                    </div>

                    {/* Date Filters */}
                    {(periodo === 'mes' || periodo === 'anio') && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {periodo === 'mes' && (
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting || filteredData.transacciones === 0}
                        className="w-full sm:w-auto"
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {exporting ? 'Exportando...' : 'Exportar'}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Ventas Totales"
                    value={formatCurrency(filteredData.ventasTotal)}
                    description={getPeriodoLabel(periodo)}
                    icon={DollarSign}
                />
                <StatCard
                    title="Transacciones"
                    value={filteredData.transacciones.toString()}
                    description={getPeriodoLabel(periodo)}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Ganancia Neta"
                    value={formatCurrency(filteredData.gananciaTotal)}
                    description="Beneficio estimado"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Productos Vendidos"
                    value={filteredData.totalProductos.toString()}
                    description={getPeriodoLabel(periodo)}
                    icon={Package}
                />
                <StatCard
                    title="Ticket Promedio"
                    value={formatCurrency(filteredData.ticketPromedio)}
                    description="Por transacción"
                    icon={TrendingUp}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Sales Bar Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Ventas - {getPeriodoLabel(periodo)}</CardTitle>
                        <CardDescription>Comportamiento de ingresos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredData.chartData.length > 0 && filteredData.ventasTotal > 0 ? (
                            <div className="flex items-end gap-2 h-64 w-full px-2">
                                {filteredData.chartData.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[30px]">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                            {d.value > 0 ? formatCurrency(d.value).replace('RD$', '') : ''}
                                        </span>
                                        <div
                                            className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary relative group"
                                            style={{ height: d.value > 0 ? `${(d.value / maxChartValue) * 100}%` : '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border">
                                                {formatCurrency(d.value)}
                                            </div>
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium truncate w-full text-center">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                No hay ventas registradas en este período
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Categories Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas por Categoría</CardTitle>
                        <CardDescription>Distribución porcentual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredData.categorias.length > 0 ? (
                                filteredData.categorias.map((cat) => (
                                    <div key={cat.nombre} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{cat.nombre}</span>
                                            <span className="font-medium">{cat.porcentaje}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${cat.color} transition-all opacity-80`}
                                                style={{ width: `${cat.porcentaje}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No hay datos suficientes
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tables Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Productos Más Vendidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredData.topProductos.length > 0 ? (
                                filteredData.topProductos.map((producto, index) => (
                                    <div
                                        key={producto.nombre}
                                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm sm:text-base">{producto.nombre}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                {producto.cantidad} vendidos
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-semibold text-primary text-sm sm:text-base">
                                                {formatCurrency(producto.total)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">Sin datos</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Ventas Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredData.recentSales.length > 0 ? (
                                filteredData.recentSales.map((venta) => (
                                    <div
                                        key={venta.id}
                                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors relative group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm sm:text-base">{venta.cliente || 'Cliente General'}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {venta.id.slice(-8).toUpperCase()} • {venta.fecha.toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={cn(
                                                "font-semibold text-sm sm:text-base",
                                                venta.estado === 'cancelada' ? "text-muted-foreground line-through" : "text-primary"
                                            )}>
                                                {formatCurrency(venta.total)}
                                            </p>
                                            <div className="flex items-center justify-end gap-2">
                                                {venta.estado === 'cancelada' && (
                                                    <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                                        Anulada
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] sm:text-xs capitalize">
                                                    {venta.metodoPago}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">Sin ventas recientes</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AnularVentaModal
                open={showAnularModal}
                onClose={() => setShowAnularModal(false)}
                venta={selectedVenta}
                onConfirm={handleConfirmAnulacion}
            />
        </div>
    )
}
