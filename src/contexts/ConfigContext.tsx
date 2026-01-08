import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ConfigSettings {
    // Tax settings
    itbisEnabled: boolean
    itbisRate: number
    propinaEnabled: boolean
    propinaRate: number
    moneda: 'DOP' | 'USD' | 'EUR'

    // Appearance
    darkMode: boolean
    soundEnabled: boolean

    // Notifications & Receipts
    notificationsEnabled: boolean
    printReceipt: boolean

    // Business info
    businessName: string
    rnc: string
    telefono: string
    direccion: string
    email: string
    website: string
    logoUrl?: string
}

const defaultSettings: ConfigSettings = {
    itbisEnabled: true,
    itbisRate: 18,
    propinaEnabled: false,
    propinaRate: 10,
    moneda: 'DOP',
    darkMode: true,
    soundEnabled: true,
    notificationsEnabled: true,
    printReceipt: true,
    businessName: '',
    rnc: '',
    telefono: '',
    direccion: '',
    email: '',
    website: '',
    logoUrl: '',
}

interface ConfigContextType {
    settings: ConfigSettings
    updateSettings: (updates: Partial<ConfigSettings>) => void
    resetSettings: () => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ConfigSettings>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('pos-config')
            if (stored) {
                try {
                    return { ...defaultSettings, ...JSON.parse(stored) }
                } catch {
                    return defaultSettings
                }
            }
        }
        return defaultSettings
    })

    useEffect(() => {
        localStorage.setItem('pos-config', JSON.stringify(settings))
    }, [settings])

    const updateSettings = (updates: Partial<ConfigSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }))
    }

    const resetSettings = () => {
        setSettings(defaultSettings)
    }

    return (
        <ConfigContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </ConfigContext.Provider>
    )
}

export function useConfig() {
    const context = useContext(ConfigContext)
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider')
    }
    return context
}
