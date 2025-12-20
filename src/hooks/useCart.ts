import { useState, useCallback } from 'react'
import { Producto } from '@/types'
import { generateId } from '@/lib/utils'

export interface CartItem {
    producto: Producto
    cantidad: number
    talla: string
    color: string
    subtotal: number
}

export interface Venta {
    id: string
    items: CartItem[]
    subtotal: number
    descuento: number
    impuesto: number
    propina: number
    total: number
    metodoPago: 'efectivo' | 'tarjeta' | 'transferencia'
    cliente?: string
    vendedor: string
    cajaId?: string
    fecha: Date
    estado: 'completada' | 'pendiente' | 'cancelada'
    itbisAplicado: boolean
    propinaAplicada: boolean
}

interface TaxConfig {
    itbisEnabled: boolean
    itbisRate: number
    propinaEnabled: boolean
    propinaRate: number
}

interface UseCartReturn {
    items: CartItem[]
    subtotal: number
    descuento: number
    impuesto: number
    propina: number
    total: number
    itbisEnabled: boolean
    propinaEnabled: boolean
    addToCart: (producto: Producto, talla: string, color: string, cantidad?: number) => void
    removeFromCart: (index: number) => void
    updateQuantity: (index: number, cantidad: number) => void
    setDescuento: (porcentaje: number) => void
    setItbisEnabled: (enabled: boolean) => void
    setPropinaEnabled: (enabled: boolean) => void
    clearCart: () => void
    checkout: (metodoPago: 'efectivo' | 'tarjeta' | 'transferencia', vendedor: string, cliente?: string) => Venta
    setTaxConfig: (config: TaxConfig) => void
}

export function useCart(initialTaxConfig?: TaxConfig): UseCartReturn {
    const [items, setItems] = useState<CartItem[]>([])
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0)
    const [itbisEnabled, setItbisEnabled] = useState(initialTaxConfig?.itbisEnabled ?? true)
    const [propinaEnabled, setPropinaEnabled] = useState(initialTaxConfig?.propinaEnabled ?? false)
    const [itbisRate, setItbisRate] = useState(initialTaxConfig?.itbisRate ?? 18)
    const [propinaRate, setPropinaRate] = useState(initialTaxConfig?.propinaRate ?? 10)

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuento = subtotal * (descuentoPorcentaje / 100)
    const baseImponible = subtotal - descuento
    const impuesto = itbisEnabled ? baseImponible * (itbisRate / 100) : 0
    const propina = propinaEnabled ? baseImponible * (propinaRate / 100) : 0
    const total = baseImponible + impuesto + propina

    const setTaxConfig = useCallback((config: TaxConfig) => {
        setItbisEnabled(config.itbisEnabled)
        setItbisRate(config.itbisRate)
        setPropinaEnabled(config.propinaEnabled)
        setPropinaRate(config.propinaRate)
    }, [])

    const addToCart = useCallback((
        producto: Producto,
        talla: string,
        color: string,
        cantidad: number = 1
    ) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(
                item => item.producto.id === producto.id &&
                    item.talla === talla &&
                    item.color === color
            )

            if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    cantidad: updated[existingIndex].cantidad + cantidad,
                    subtotal: (updated[existingIndex].cantidad + cantidad) * producto.precio
                }
                return updated
            }

            return [...prev, {
                producto,
                cantidad,
                talla,
                color,
                subtotal: cantidad * producto.precio
            }]
        })
    }, [])

    const removeFromCart = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index))
    }, [])

    const updateQuantity = useCallback((index: number, cantidad: number) => {
        if (cantidad <= 0) {
            removeFromCart(index)
            return
        }

        setItems(prev => {
            const updated = [...prev]
            if (updated[index]) {
                updated[index] = {
                    ...updated[index],
                    cantidad,
                    subtotal: cantidad * updated[index].producto.precio
                }
            }
            return updated
        })
    }, [removeFromCart])

    const setDescuento = useCallback((porcentaje: number) => {
        setDescuentoPorcentaje(Math.max(0, Math.min(100, porcentaje)))
    }, [])

    const clearCart = useCallback(() => {
        setItems([])
        setDescuentoPorcentaje(0)
    }, [])

    const checkout = useCallback((
        metodoPago: 'efectivo' | 'tarjeta' | 'transferencia',
        vendedor: string,
        cliente?: string
    ): Venta => {
        const venta: Venta = {
            id: generateId(),
            items: [...items],
            subtotal,
            descuento,
            impuesto,
            propina,
            total,
            metodoPago,
            vendedor,
            cliente: cliente || 'Cliente General',
            fecha: new Date(),
            estado: 'completada',
            itbisAplicado: itbisEnabled,
            propinaAplicada: propinaEnabled
        }

        clearCart()
        return venta
    }, [items, subtotal, descuento, impuesto, propina, total, itbisEnabled, propinaEnabled, clearCart])

    return {
        items,
        subtotal,
        descuento,
        impuesto,
        propina,
        total,
        itbisEnabled,
        propinaEnabled,
        addToCart,
        removeFromCart,
        updateQuantity,
        setDescuento,
        setItbisEnabled,
        setPropinaEnabled,
        clearCart,
        checkout,
        setTaxConfig
    }
}
