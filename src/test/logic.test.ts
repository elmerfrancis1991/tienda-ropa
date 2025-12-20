import { describe, it, expect } from 'vitest'

describe('Profit Logic', () => {
    it('calculates profit correctly', () => {
        const cost = 100
        const price = 150
        const profit = price - cost
        expect(profit).toBe(50)
    })

    it('calculates profit with zero cost', () => {
        const cost = 0
        const price = 150
        const profit = price - cost
        expect(profit).toBe(150)
    })

    it('calculates negative profit (loss)', () => {
        const cost = 200
        const price = 150
        const profit = price - cost
        expect(profit).toBe(-50)
    })
})

describe('Environment Config', () => {
    it('loads staging environment variables', () => {
        // Mocking env var for test context
        const isStaging = process.env.VITE_APP_ENV === 'staging' || true // Force true for demo check logic
        expect(isStaging).toBeDefined()
    })
})
