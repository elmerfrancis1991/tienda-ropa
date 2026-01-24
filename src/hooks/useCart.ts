import { useState, useCallback } from 'react'
import { Producto } from '@/types'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export interface CartItem {
    cartItemId: string
    producto: Producto
    cantidad: number
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
    tenantId: string // Multi-tenant
    fecha: Date
    estado: 'completada' | 'pendiente' | 'cancelada'
    itbisAplicado: boolean
    propinaAplicada: boolean
    montoRecibido?: number
    cambio?: number
    motivoAnulacion?: string
    fechaAnulacion?: Date
    anuladaPor?: string
}

interface TaxConfig {
    itbisEnabled: boolean
    itbisRate: number
    propinaEnabled: boolean
    propinaRate: number
}

export interface UseCartReturn {
    items: CartItem[]
    subtotal: number
    descuento: number
    impuesto: number
    propina: number
    total: number
    itbisEnabled: boolean
    propinaEnabled: boolean
    addToCart: (producto: Producto, cantidad?: number) => void
    removeFromCart: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, cantidad: number) => void
    setDescuento: (porcentaje: number) => void
    setItbisEnabled: (enabled: boolean) => void
    setPropinaEnabled: (enabled: boolean) => void
    clearCart: () => void
    checkout: (metodoPago: 'efectivo' | 'tarjeta' | 'transferencia', vendedor: string, cliente?: string) => Venta
    setTaxConfig: (config: TaxConfig) => void
}

export function useCart(initialTaxConfig?: TaxConfig): UseCartReturn {
    const { user } = useAuth()
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
        cantidad: number = 1
    ) => {
        setItems(prev => {
            // Find existing item with same product ID
            const existingItemIndex = prev.findIndex(item => item.producto.id === producto.id)

            // Total quantity check
            const totalInCart = prev.reduce((sum, item) =>
                item.producto.id === producto.id ? sum + item.cantidad : sum, 0
            )

            if (totalInCart + cantidad > producto.stock) {
                alert(`No hay suficiente stock. Disponible: ${producto.stock}. En carrito: ${totalInCart}`)
                return prev
            }

            if (existingItemIndex > -1) {
                // Update existing item
                const newItems = [...prev]
                const existingItem = newItems[existingItemIndex]
                const newQuantity = existingItem.cantidad + cantidad

                newItems[existingItemIndex] = {
                    ...existingItem,
                    cantidad: newQuantity,
                    subtotal: newQuantity * producto.precio
                }
                return newItems
            }

            // Add new item
            return [...prev, {
                cartItemId: generateId(),
                producto,
                cantidad,
                subtotal: cantidad * producto.precio
            }]
        })
    }, [])

    const removeFromCart = useCallback((cartItemId: string) => {
        setItems(prev => prev.filter((item) => item.cartItemId !== cartItemId))
    }, [])

    const updateQuantity = useCallback((cartItemId: string, cantidad: number) => {
        if (cantidad <= 0) {
            removeFromCart(cartItemId)
            return
        }

        setItems(prev => {
            const index = prev.findIndex(item => item.cartItemId === cartItemId)
            if (index === -1) return prev

            const updated = [...prev]
            // Validate stock validation
            if (cantidad > updated[index].producto.stock) {
                return updated
            }

            updated[index] = {
                ...updated[index],
                cantidad,
                subtotal: cantidad * updated[index].producto.precio
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
            tenantId: user?.tenantId || 'default', // Multi-tenant
            fecha: new Date(),
            estado: 'completada',
            itbisAplicado: itbisEnabled,
            propinaAplicada: propinaEnabled
        }

        clearCart()
        return venta
    }, [items, subtotal, descuento, impuesto, propina, total, itbisEnabled, propinaEnabled, clearCart, user])

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
