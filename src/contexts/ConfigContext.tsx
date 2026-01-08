import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

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
    const { user } = useAuth()
    const [settings, setSettings] = useState<ConfigSettings>(defaultSettings)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load settings when user is available
    useEffect(() => {
        if (user?.tenantId && !isLoaded) {
            const stored = localStorage.getItem(`pos-config-${user.tenantId}`)
            if (stored) {
                try {
                    setSettings({ ...defaultSettings, ...JSON.parse(stored) })
                } catch (e) {
                    console.error("Error loading config:", e)
                }
            }
            setIsLoaded(true)
        }
    }, [user?.tenantId, isLoaded])

    // Save settings when they change
    useEffect(() => {
        if (user?.tenantId && isLoaded) {
            localStorage.setItem(`pos-config-${user.tenantId}`, JSON.stringify(settings))
        }
    }, [settings, user?.tenantId, isLoaded])

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
