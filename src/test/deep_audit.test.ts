import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../hooks/useCart'
import { useVentas } from '../hooks/useVentas'
import { Producto } from '../types'
import { offlineQueue } from '../lib/offlineQueue'

let mockIsOnline = true
let mockPermisos = ['pos:vender', 'ventas:anular', 'pos:descuentos']
let mockSnapshotCallback: any = null

vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: mockIsOnline }) }))
vi.mock('../hooks/useCierreCaja', () => ({
    useCierreCaja: () => ({ cajaActual: { id: 'box-1', estado: 'abierto' }, isCajaAbierta: true, loading: false })
}))
vi.mock('../lib/offlineQueue', () => ({
    offlineQueue: {
        addVenta: vi.fn(() => Promise.resolve(1)),
        getVentasPendientes: vi.fn(() => Promise.resolve([])),
        removeVenta: vi.fn(() => Promise.resolve()),
        clearQueue: vi.fn(() => Promise.resolve())
    }
}))
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { tenantId: 't1', nombre: 'Test' }, hasPermiso: (p: string) => mockPermisos.includes(p) })
}))
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(), addDoc: vi.fn(), query: vi.fn(), orderBy: vi.fn(), where: vi.fn(), doc: vi.fn(() => ({ id: 'd1' })),
    onSnapshot: vi.fn((q, cb) => { mockSnapshotCallback = cb; return vi.fn() }),
    Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }), now: () => ({ toDate: () => new Date() }) },
    runTransaction: vi.fn(async (db, fn) => await fn({
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ estado: 'abierto', stock: 10 }) }),
        set: vi.fn(), update: vi.fn(), delete: vi.fn()
    })),
    writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) })),
    increment: vi.fn((n) => n)
}))

const MOCK_PRODUCT: Producto = {
    id: 'p1', nombre: 'Test', precio: 1000, stock: 5, categoria: 'Ropa', activo: true, codigoBarra: '123',
    tenantId: 't1', descripcion: 'D', talla: 'M', color: 'A', imagen: '', createdAt: new Date(), updatedAt: new Date()
}

describe('Auditoría POS v1.6.6', () => {
    beforeEach(() => { vi.clearAllMocks(); mockIsOnline = true; mockPermisos = ['pos:vender', 'ventas:anular'] })

    it('T1: Agrupación de duplicados', () => {
        const { result } = renderHook(() => useCart())
        act(() => { result.current.addToCart(MOCK_PRODUCT, 1); result.current.addToCart(MOCK_PRODUCT, 2) })
        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].cantidad).toBe(3)
    })

    it('T2: Límite de stock', () => {
        const { result } = renderHook(() => useCart())
        vi.spyOn(window, 'alert').mockImplementation(() => { })
        act(() => { result.current.addToCart(MOCK_PRODUCT, 5); result.current.addToCart(MOCK_PRODUCT, 1) })
        expect(result.current.items[0].cantidad).toBe(5)
    })

    it('T5 & T7: Venta Offline Fallback', async () => {
        mockIsOnline = false
        const { result } = renderHook(() => useVentas())
        await act(async () => {
            const res = await result.current.agregarVenta({ id: 'v1', total: 100, items: [], cajaId: 'b1', fecha: new Date() } as any)
            expect(res).toBe('offline-queued')
        })
        expect(offlineQueue.addVenta).toHaveBeenCalled()
    })

    it('T8: Sincronización Masiva (Burst)', async () => {
        mockOfflineQueue: vi.mocked(offlineQueue.getVentasPendientes).mockResolvedValue([
            { offlineId: 1, id: 'v1', items: [], total: 100, fecha: new Date(), cajaId: 'b1', tenantId: 't1' }
        ] as any)

        const { result } = renderHook(() => useVentas())
        // Trigger loading=false
        act(() => { if (mockSnapshotCallback) mockSnapshotCallback({ docs: [] }) })

        await act(async () => { await result.current.syncOfflineSales() })
        expect(offlineQueue.removeVenta).toHaveBeenCalled()
    })

    it('T9 & T12: Anulación y Reversión', async () => {
        const { result } = renderHook(() => useVentas())
        act(() => {
            if (mockSnapshotCallback) mockSnapshotCallback({
                docs: [{ id: 'v1', data: () => ({ id: 'v1', estado: 'completada', items: [{ producto: { id: 'p1' }, cantidad: 1 }], fecha: { toDate: () => new Date() } }), exists: () => true }]
            })
        })

        const revertSpy = vi.fn().mockResolvedValue(undefined)
        await act(async () => { await result.current.anularVenta('v1', 'Error', revertSpy) })
        expect(revertSpy).toHaveBeenCalled()

        // Double void protection
        act(() => {
            if (mockSnapshotCallback) mockSnapshotCallback({
                docs: [{ id: 'v1', data: () => ({ id: 'v1', estado: 'cancelada', items: [], fecha: { toDate: () => new Date() } }), exists: () => true }]
            })
        })
        await expect(act(async () => { await result.current.anularVenta('v1', 'R', revertSpy) })).rejects.toThrow('ya fue anulada')
    })

    it('T11: Permisos de Seguridad', async () => {
        mockPermisos = ['pos:vender'] // No anular
        const { result } = renderHook(() => useVentas())
        await expect(act(async () => { await result.current.anularVenta('v1', 'T', vi.fn()) })).rejects.toThrow('No tienes permisos')
    })

    it('T4: Precisión de Impuestos con Descuentos', () => {
        const { result } = renderHook(() => useCart({ itbisEnabled: true, itbisRate: 18, propinaEnabled: true, propinaRate: 10 }))
        act(() => {
            result.current.addToCart(MOCK_PRODUCT, 1) // 1000
            result.current.setDescuento(10) // Base 900
        })
        expect(result.current.subtotal).toBe(1000)
        expect(result.current.descuento).toBe(100)
        expect(result.current.impuesto).toBe(162) // 900 * 0.18
        expect(result.current.propina).toBe(90)   // 900 * 0.10
        expect(result.current.total).toBe(1152)      // 900 + 162 + 90
    })

    it('T10: Las ventas canceladas deben estar marcadas correctamente para exclusión financiera', () => {
        const { result } = renderHook(() => useVentas())
        act(() => {
            if (mockSnapshotCallback) mockSnapshotCallback({
                docs: [{ id: 'v1', data: () => ({ estado: 'cancelada', total: 500 }) }]
            })
        })
        expect(result.current.ventas[0].estado).toBe('cancelada')
    })
})
