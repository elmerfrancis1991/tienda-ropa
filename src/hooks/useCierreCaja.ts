import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    where,
    Timestamp,
    limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CierreCaja } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useCierreCaja() {
    const [cierres, setCierres] = useState<CierreCaja[]>([])
    const [cajaActual, setCajaActual] = useState<CierreCaja | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    // Escuchar cierres de caja
    useEffect(() => {
        if (!user?.uid || !user?.tenantId) return // Wait for user

        const q = query(
            collection(db, 'cierres_caja'),
            where('tenantId', '==', user.tenantId),
            limit(100) // Incremented limit to ensure enough data for in-memory sort
        )

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const cierresData: CierreCaja[] = snapshot.docs.map(doc => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        fecha: data.fecha?.toDate() || new Date(),
                        usuarioId: data.usuarioId,
                        usuarioNombre: data.usuarioNombre,
                        montoApertura: data.montoApertura || 0,
                        montoCierre: data.montoCierre || 0,
                        ventasEfectivo: data.ventasEfectivo || 0,
                        ventasTarjeta: data.ventasTarjeta || 0,
                        ventasTransferencia: data.ventasTransferencia || 0,
                        ventasTotal: data.ventasTotal || 0,
                        diferencia: data.diferencia || 0,
                        observaciones: data.observaciones,
                        estado: data.estado || 'cerrado',
                        createdAt: data.createdAt?.toDate() || new Date(),
                        closedAt: data.closedAt?.toDate(),
                        tenantId: data.tenantId
                    }
                })

                // Sort in memory to avoid requiring a composite index on Firestore
                cierresData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

                setCierres(cierresData)

                // Buscar caja abierta del usuario actual
                const cajaAbierta = cierresData.find(c =>
                    c.estado === 'abierto' && c.usuarioId === user.uid
                )
                setCajaActual(cajaAbierta || null)

                setLoading(false)
            },
            (err) => {
                console.error('Error loading cierres:', err)
                setError('Error al cargar cierres de caja: ' + err.message)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [user?.uid, user?.tenantId])

    // Abrir Caja
    const abrirCaja = useCallback(async (montoApertura: number): Promise<string> => {
        if (!user) throw new Error('Usuario no autenticado')
        if (!user.tenantId) throw new Error('Error de configuración: Sin Tenant ID')

        if (cajaActual) {
            throw new Error('Ya tiene una caja abierta. Debe cerrarla primero.')
        }

        try {
            const nuevaCaja = {
                fecha: Timestamp.now(),
                usuarioId: user.uid,
                usuarioNombre: user.nombre,
                tenantId: user.tenantId, // Add tenantId
                montoApertura,
                montoCierre: 0,
                ventasEfectivo: 0,
                ventasTarjeta: 0,
                ventasTransferencia: 0,
                ventasTotal: 0,
                diferencia: 0,
                estado: 'abierto',
                createdAt: Timestamp.now()
            }

            const docRef = await addDoc(collection(db, 'cierres_caja'), nuevaCaja)
            return docRef.id
        } catch (err: any) {
            console.error('Error opening caja:', err)
            throw new Error(`Error al abrir caja: ${err.message || 'Error desconocido'}`)
        }
    }, [user, cajaActual])

    // Cerrar Caja
    const cerrarCaja = useCallback(async (
        montoCierre: number,
        ventasEfectivo: number,
        ventasTarjeta: number,
        ventasTransferencia: number,
        observaciones?: string
    ): Promise<void> => {
        if (!user) throw new Error('Usuario no autenticado')
        if (!cajaActual) throw new Error('No hay caja abierta para cerrar')

        try {
            const ventasTotal = ventasEfectivo + ventasTarjeta + ventasTransferencia
            const montoEsperado = cajaActual.montoApertura + ventasEfectivo
            const diferencia = montoCierre - montoEsperado

            await updateDoc(doc(db, 'cierres_caja', cajaActual.id), {
                montoCierre,
                ventasEfectivo,
                ventasTarjeta,
                ventasTransferencia,
                ventasTotal,
                diferencia,
                observaciones: observaciones || '',
                estado: 'cerrado',
                closedAt: Timestamp.now()
            })
        } catch (err) {
            console.error('Error closing caja:', err)
            throw new Error('Error al cerrar caja')
        }
    }, [user, cajaActual])

    // Obtener estado de caja
    const isCajaAbierta = !!cajaActual

    return {
        cierres,
        cajaActual,
        loading,
        error,
        abrirCaja,
        cerrarCaja,
        isCajaAbierta
    }
}
