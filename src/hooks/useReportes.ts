import { useMemo } from 'react'
import { useVentas } from './useVentas'
import { Venta } from './useCart'

export type Periodo = 'dia' | 'semana' | 'mes' | 'anio' | 'todos'

export function useReportes() {
    const { ventas, loading, error } = useVentas()

    const getStatsByPeriod = (periodo: Periodo) => {
        const now = new Date()

        // Calculate start of dates without mutating 'now'
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const currentDay = now.getDay() // 0 = Sun, 1 = Mon...
        // Adjust to Monday (1) being start of week, moving back 'currentDay - 1' days.
        // If Sunday (0), we want to move back 6 days.
        const dayDiff = currentDay === 0 ? 6 : currentDay - 1
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayDiff)
        startOfWeek.setHours(0, 0, 0, 0)

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        let startDate = new Date(0) // Begin of time
        if (periodo === 'dia') startDate = startOfDay
        if (periodo === 'semana') startDate = startOfWeek
        if (periodo === 'mes') startDate = startOfMonth
        if (periodo === 'anio') startDate = startOfYear

        // Filter sales by date
        const ventasPorFecha = ventas.filter(v => {
            const fecha = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
            return fecha >= startDate
        })

        // Filter valid sales for stats (not cancelled)
        const ventasPeriodo = ventasPorFecha.filter(v => v.estado !== 'cancelada')

        // Calculate totals
        const ventasTotal = ventasPeriodo.reduce((sum, v) => sum + v.total, 0)
        const transacciones = ventasPeriodo.length
        const totalProductos = ventasPeriodo.reduce((sum, v) => sum + v.items.reduce((s, i) => s + i.cantidad, 0), 0)

        // Calcular Ganancia Total (Precio Venta - Costo)
        const gananciaTotal = ventasPeriodo.reduce((sum, v) => {
            const gananciaVenta = v.items.reduce((acc, item) => {
                const costoUnitario = item.producto.costo || 0
                const precioVentaTotal = item.subtotal // item.cantidad * precio
                const costoTotal = costoUnitario * item.cantidad
                return acc + (precioVentaTotal - costoTotal)
            }, 0)
            return sum + gananciaVenta
        }, 0)

        const ticketPromedio = transacciones > 0 ? ventasTotal / transacciones : 0

        // Charts Logic
        const chartMap = new Map<string, number>()
        if (periodo === 'dia') {
            for (let i = 8; i <= 20; i += 2) chartMap.set(`${i}:00`, 0)
            ventasPeriodo.forEach(v => {
                const date = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
                const hour = date.getHours()
                const key = `${hour}:00`
                chartMap.set(key, (chartMap.get(key) || 0) + v.total)
            })
        } else if (periodo === 'semana') {
            const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            dias.forEach(d => chartMap.set(d, 0))
            ventasPeriodo.forEach(v => {
                const date = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
                const dayName = dias[date.getDay()]
                chartMap.set(dayName, (chartMap.get(dayName) || 0) + v.total)
            })
        } else {
            // Month/General: Group by date
            ventasPeriodo.forEach(v => {
                const date = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
                const key = date.toLocaleDateString()
                chartMap.set(key, (chartMap.get(key) || 0) + v.total)
            })
        }

        const chartData = Array.from(chartMap.entries()).map(([label, value]) => ({ label, value }))

        // Top Products
        const productMap = new Map<string, { cantidad: number, total: number }>()
        ventasPeriodo.forEach(v => {
            v.items.forEach(item => {
                const current = productMap.get(item.producto.nombre) || { cantidad: 0, total: 0 }
                productMap.set(item.producto.nombre, {
                    cantidad: current.cantidad + item.cantidad,
                    total: current.total + item.subtotal
                })
            })
        })

        const topProductos = Array.from(productMap.entries())
            .map(([nombre, stats]) => ({ nombre, ...stats }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5)

        // Categories
        const categoryMap = new Map<string, number>()
        let totalItemsCount = 0
        ventasPeriodo.forEach(v => {
            v.items.forEach(item => {
                const cat = item.producto.categoria || 'Otros'
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
                totalItemsCount++
            })
        })

        const categorias = Array.from(categoryMap.entries()).map(([nombre, count]) => ({
            nombre,
            porcentaje: totalItemsCount > 0 ? Math.round((count / totalItemsCount) * 100) : 0,
            color: 'bg-primary'
        })).sort((a, b) => b.porcentaje - a.porcentaje)


        return {
            ventasTotal,
            gananciaTotal,
            transacciones,
            totalProductos,
            ticketPromedio,
            chartData,
            topProductos,
            categorias,
            recentSales: ventasPorFecha.slice(0, 10),
            ventasPeriodo
        }
    }

    return {
        ventas,
        loading,
        error,
        getStatsByPeriod
    }
}
