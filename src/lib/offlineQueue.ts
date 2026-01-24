import { Venta } from '@/hooks/useCart'

const DB_NAME = 'TiendaPOS_Offline'
const STORE_NAME = 'ventas_pendientes'
const DB_VERSION = 1

export interface OfflineVenta extends Venta {
    offlineId?: number
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'offlineId', autoIncrement: true })
            }
        }
    })
}

export const offlineQueue = {
    async addVenta(venta: Venta): Promise<number> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.add({ ...venta, synced: false })

            request.onsuccess = () => resolve(request.result as number)
            request.onerror = () => reject(request.error)
        })
    },

    async getVentasPendientes(): Promise<OfflineVenta[]> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    },

    async removeVenta(offlineId: number): Promise<void> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(offlineId)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    },

    async clearQueue(): Promise<void> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.clear()

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }
}
