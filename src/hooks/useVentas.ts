import { useState, useCallback, useEffect } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, runTransaction, doc, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Venta } from './useCart'
import { useAuth } from '@/contexts/AuthContext'

// Fallback demo data in case Firebase is not configured or fails
// ... (DEMO_VENTAS unchanged)

export function useVentas() {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDemo, setIsDemo] = useState(false)
    const { user } = useAuth()

    // Setup listener for real-time updates without aggressive timeout fallback
    useEffect(() => {
        if (!user?.tenantId) return;

        let unsubscribe: () => void = () => { };

        const connectToFirestore = async () => {
            try {
                const q = query(
                    collection(db, 'ventas'),
                    where('tenantId', '==', user.tenantId)
                )

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

                    // Sort in memory to avoid requiring a composite index
                    ventasData.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

                    setVentas(ventasData)
                    setLoading(false)
                    setError(null)
                    setIsDemo(false)
                }, (err) => {
                    console.error("Firestore connection failed:", err)
                    setError("Error de conexión: " + err.message)
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
    }, [user?.tenantId])

    // Transactional sale processing
    const procesarVenta = useCallback(async (venta: Venta) => {
        setLoading(true)
        setError(null)
        let savedVentaId = ''
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

                // 2. Validate Cash Drawer Status
                if (!venta.cajaId) {
                    throw new Error("No hay una caja abierta vinculada a esta venta.")
                }
                const cajaRef = doc(db, 'cierres_caja', venta.cajaId)
                const cajaSnap = await transaction.get(cajaRef)

                if (!cajaSnap.exists() || cajaSnap.data()?.estado !== 'abierto') {
                    throw new Error("La caja ha sido cerrada. No se pueden procesar más ventas.")
                }

                // 3. Validate stock availability
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
                savedVentaId = newVentaRef.id

                const ventaParaGuardar = {
                    ...venta,
                    id: newVentaRef.id,
                    cajaId: venta.cajaId || null,
                    tenantId: user?.tenantId, // Force current user's tenant
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
            return savedVentaId
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
