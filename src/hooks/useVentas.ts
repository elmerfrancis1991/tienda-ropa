import { useState, useCallback, useEffect } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, runTransaction, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Venta } from './useCart'

// Fallback demo data in case Firebase is not configured or fails
const DEMO_VENTAS: Venta[] = [
    {
        id: 'DEMO-001',
        items: [{ producto: { id: 'p1', nombre: 'Camisa Demo', descripcion: 'Producto de prueba', precio: 1500, categoria: 'Ropa', imagen: '', tallas: [], colores: [], stock: 10, activo: true, createdAt: new Date(), updatedAt: new Date() }, cantidad: 2, talla: 'M', color: 'Azul', subtotal: 3000 }],
        subtotal: 3000,
        descuento: 0,
        impuesto: 540,
        propina: 0,
        total: 3540,
        metodoPago: 'efectivo',
        vendedor: 'Admin',
        cliente: 'Cliente Demo',
        fecha: new Date(),
        estado: 'completada',
        itbisAplicado: true,
        propinaAplicada: false
    }
]

export function useVentas() {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDemo, setIsDemo] = useState(false)

    // Setup listener for real-time updates without aggressive timeout fallback
    useEffect(() => {
        let unsubscribe: () => void = () => { };

        const connectToFirestore = async () => {
            try {
                const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'))

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const ventasData = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            id: doc.id,
                            // Handle Timestamp vs Date compatibility
                            fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha)
                        }
                    }) as Venta[]

                    setVentas(ventasData)
                    setLoading(false)
                    setError(null)
                    setIsDemo(false)
                }, (err) => {
                    console.error("Firestore connection failed:", err)
                    setError("Error de conexión: " + err.message)
                    // Do NOT fall back to demo mode silently
                    // setIsDemo(true) 
                    setLoading(false)
                })

            } catch (err) {
                console.error("Error connecting to sales DB:", err)
                setError("No se pudo iniciar la conexión")
                setLoading(false)
            }
        }

        connectToFirestore()

        return () => {
            unsubscribe()
        }
    }, [])

    // Transactional sale processing
    const procesarVenta = useCallback(async (venta: Venta) => {
        setLoading(true)
        setError(null)
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Read all product documents first to get fresh stock
                const productReads = venta.items.map(item => {
                    const ref = doc(db, 'productos', item.producto.id)
                    return { ref, item }
                })

                const productDocs = await Promise.all(productReads.map(async (p) => {
                    const docSnap = await transaction.get(p.ref)
                    return { ...p, docSnap }
                }))

                // 2. Validate stock availability
                for (const p of productDocs) {
                    if (!p.docSnap.exists()) {
                        throw new Error(`El producto "${p.item.producto.nombre}" ya no existe.`)
                    }

                    const data = p.docSnap.data()
                    const currentStock = Number(data?.stock) || 0

                    if (currentStock < p.item.cantidad) {
                        throw new Error(`Stock insuficiente para "${p.item.producto.nombre}". Disponible: ${currentStock}`)
                    }
                }

                // 3. Perform updates
                // A. Create Sale Document (We need a ref for a new doc)
                const newVentaRef = doc(collection(db, 'ventas'))
                const ventaParaGuardar = {
                    ...venta,
                    id: newVentaRef.id,
                    cajaId: venta.cajaId || null,
                    fecha: Timestamp.fromDate(venta.fecha)
                }
                transaction.set(newVentaRef, ventaParaGuardar)

                // B. Update Products Stock
                for (const p of productDocs) {
                    const data = p.docSnap.data()
                    const currentStock = Number(data?.stock) || 0
                    const newStock = currentStock - p.item.cantidad

                    transaction.update(p.ref, {
                        stock: newStock,
                        updatedAt: Timestamp.now()
                    })
                }
            })

            setLoading(false)
            return true

        } catch (err) {
            console.error("Error processing sale transaction:", err)
            const msg = err instanceof Error ? err.message : "Error desconocido al procesar la venta"
            setError(msg)
            setLoading(false)
            throw new Error(msg)
        }
    }, [])

    // Kept for compatibility if used elsewhere, but simply aliases to simple addDoc (unsafe)
    // or better, remove it if not used. But the interface might expect it.
    // Let's deprecate it or make it just a wrapper.
    const agregarVenta = useCallback(async (venta: Venta) => {
        return procesarVenta(venta)
    }, [procesarVenta])

    return {
        ventas,
        loading,
        error,
        agregarVenta,
        procesarVenta,
        isDemo
    }
}
