import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreating schema from ProductoForm for isolated testing
const productoSchema = z.object({
    nombre: z.string().min(2),
    precio: z.number().min(1),
    costo: z.number().min(0).optional(),
    stock: z.number().min(0)
})

describe('Product Validation', () => {
    it('validates a correct product', () => {
        const result = productoSchema.safeParse({
            nombre: 'Camisa',
            precio: 100,
            costo: 50,
            stock: 10
        })
        expect(result.success).toBe(true)
    })

    it('rejects negative price', () => {
        const result = productoSchema.safeParse({
            nombre: 'Camisa',
            precio: -10,
            costo: 50,
            stock: 10
        })
        expect(result.success).toBe(false)
    })

    it('rejects negative stock', () => {
        const result = productoSchema.safeParse({
            nombre: 'Camisa',
            precio: 100,
            stock: -5
        })
        expect(result.success).toBe(false)
    })

    it('allows optional cost', () => {
        const result = productoSchema.safeParse({
            nombre: 'Camisa',
            precio: 100,
            stock: 10
        })
        expect(result.success).toBe(true)
    })
})
