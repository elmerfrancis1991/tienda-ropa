import { useMemo } from 'react'
import { useVentas } from './useVentas'
import { Venta } from './useCart'

export type Periodo = 'dia' | 'semana' | 'mes' | 'anio' | 'todos'

export function useReportes() {
    const { ventas, loading, error } = useVentas()

    const getStatsByDateRange = (startDate: Date, endDate: Date) => {
        // Filter sales by date range
        const ventasPorFecha = ventas.filter(v => {
            const fecha = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
            return fecha >= startDate && fecha <= endDate
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
        // Determine granularity based on range duration
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 1) {
            // Horas
            for (let i = 8; i <= 20; i += 2) chartMap.set(`${i}:00`, 0)
            ventasPeriodo.forEach(v => {
                const date = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
                const hour = date.getHours()
                const key = `${hour}:00`
                chartMap.set(key, (chartMap.get(key) || 0) + v.total)
            })
        } else if (diffDays <= 7) {
            // Dias nombre
            const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            dias.forEach(d => chartMap.set(d, 0))
            ventasPeriodo.forEach(v => {
                const date = v.fecha instanceof Date ? v.fecha : (v.fecha as any).toDate()
                const dayName = dias[date.getDay()]
                chartMap.set(dayName, (chartMap.get(dayName) || 0) + v.total)
            })
        } else {
            // Dates
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

    const getStatsByPeriod = (periodo: Periodo, customDate?: Date) => {
        const now = customDate ? new Date(customDate) : new Date()
        let startDate = new Date(0)
        let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        if (periodo === 'dia') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        } else if (periodo === 'semana') {
            const currentDay = now.getDay()
            const dayDiff = currentDay === 0 ? 6 : currentDay - 1
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayDiff)
            startDate.setHours(0, 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) // End of today (or end of week?) usually 'This Week' implies up to now.
        } else if (periodo === 'mes') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            // End of month
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        } else if (periodo === 'anio') {
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        } else if (periodo === 'todos') {
            endDate = new Date()
        }

        return getStatsByDateRange(startDate, endDate)
    }

    return {
        ventas,
        loading,
        error,
        getStatsByPeriod,
        getStatsByDateRange
    }
}
