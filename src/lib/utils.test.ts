import { describe, it, expect } from 'vitest'
import { formatCurrency, generateId } from '../lib/utils'

describe('Utils', () => {
    it('formatCurrency formats numbers correctly', () => {
        expect(formatCurrency(1000)).toBe('RD$1,000.00')
        expect(formatCurrency(0)).toBe('RD$0.00')
        expect(formatCurrency(10.5)).toBe('RD$10.50')
    })

    it('generateId creates unique strings', () => {
        const id1 = generateId()
        const id2 = generateId()
        expect(id1).not.toBe(id2)
        expect(id1.length).toBeGreaterThan(0)
    })
})
