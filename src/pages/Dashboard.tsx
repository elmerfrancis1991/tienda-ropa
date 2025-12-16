import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react'
import { useReportes } from '@/hooks/useReportes'
import { useProductos } from '@/hooks/useProductos'
import { formatCurrency } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string
    description: string
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: string
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue }: StatCardProps) {
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
                <div className="flex items-center gap-2 mt-1">
                    {trend && (
                        <Badge variant={trend === 'up' ? 'success' : 'destructive'} className="px-1.5 py-0.5">
                            {trend === 'up' ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span className="ml-0.5 text-xs">{trendValue}</span>
                        </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const { user } = useAuth()
    const { getStatsByPeriod, loading: loadingReports } = useReportes()
    const { productos, loading: loadingProductos } = useProductos()

    const statsHoy = getStatsByPeriod('dia')
    const statsMes = getStatsByPeriod('mes')

    // Inventory calculations
    const lowStockProducts = productos.filter(p => p.stock <= 5).slice(0, 5)
    const totalStock = productos.reduce((sum, p) => sum + p.stock, 0)

    if (loadingReports || loadingProductos) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Real data for dashboard
    const stats = [
        {
            title: 'Ventas del Día',
            value: formatCurrency(statsHoy.ventasTotal),
            description: `${statsHoy.transacciones} transacciones hoy`,
            icon: DollarSign,
            trend: 'up' as const, // Comparison to yesterday logic omitted for simplicity, dynamic in future
            trendValue: 'Hoy',
        },
        {
            title: 'Productos Vendidos',
            value: statsHoy.totalProductos.toString(),
            description: 'Unidades hoy',
            icon: ShoppingCart,
            trend: 'up' as const,
            trendValue: 'Hoy',
        },
        {
            title: 'Inventario Total',
            value: totalStock.toString(),
            description: 'Productos en stock',
            icon: Package,
            trend: 'down' as const,
            trendValue: '',
        },
        {
            title: 'Ventas del Mes',
            value: formatCurrency(statsMes.ventasTotal),
            description: 'Total acumulado',
            icon: TrendingUp,
            trend: 'up' as const,
            trendValue: 'Mes',
        },
        {
            title: 'Ganancia Estimada',
            value: formatCurrency(statsHoy.gananciaTotal),
            description: 'Beneficio neto hoy',
            icon: DollarSign,
            trend: 'up' as const,
            trendValue: 'Hoy',
        },
    ]

    const recentSales = statsMes.recentSales.slice(0, 5)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Aquí está el resumen de tu tienda para hoy
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
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
                            {recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {sale.items.length === 1
                                                ? sale.items[0].producto.nombre
                                                : `${sale.items.length} productos`
                                            }
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {sale.fecha.toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-primary">{formatCurrency(sale.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-yellow-500" />
                            Productos con Bajo Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                    >
                                        <span className="font-medium">{product.nombre}</span>
                                        <Badge variant="warning">{product.stock} unidades</Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Todo el inventario está saludable
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5 border-primary/20">
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Acceso Rápido</h3>
                            <p className="text-sm text-muted-foreground">
                                Accede a las funciones principales del sistema
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href="/pos"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Nueva Venta
                            </a>
                            <a
                                href="/productos"
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                            >
                                Ver Productos
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
