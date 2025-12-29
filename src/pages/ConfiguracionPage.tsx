import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Settings,
    Building2,
    Receipt,
    Palette,
    Bell,
    Save,
    Loader2,
    Check,
    Store,
    Phone,
    MapPin,
    Globe,
    Percent,
    DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useConfig } from '@/contexts/ConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'

const businessSchema = z.object({
    businessName: z.string().min(2, 'Nombre muy corto'),
    rnc: z.string().min(9, 'RNC inválido').max(11),
    telefono: z.string().min(10, 'Teléfono inválido'),
    direccion: z.string().min(10, 'Dirección muy corta'),
    email: z.string().email('Email inválido'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type BusinessFormData = z.infer<typeof businessSchema>

interface ToggleSwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
    description?: string
}

function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-sm sm:text-base">{label}</p>
                {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? 'bg-primary' : 'bg-muted'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    )
}

export default function ConfiguracionPage() {
    const { settings, updateSettings } = useConfig()
    const { theme, toggleTheme } = useTheme()
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BusinessFormData>({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            businessName: settings.businessName,
            rnc: settings.rnc,
            telefono: settings.telefono,
            direccion: settings.direccion,
            email: settings.email,
            website: settings.website,
            logoUrl: settings.logoUrl || '',
        },
    })

    const handleSave = async () => {
        setSaving(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleBusinessSubmit = async (data: BusinessFormData) => {
        updateSettings(data)
        await handleSave()
    }

    const handleTaxSave = async () => {
        await handleSave()
    }

    // Handle theme toggle
    const handleDarkModeToggle = (checked: boolean) => {
        updateSettings({ darkMode: checked })
        if ((checked && theme === 'light') || (!checked && theme === 'dark')) {
            toggleTheme()
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Configuración
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Personaliza la configuración del sistema
                    </p>
                </div>
                {saved && (
                    <Badge variant="success" className="h-fit self-start sm:self-auto">
                        <Check className="h-3 w-3 mr-1" />
                        Guardado
                    </Badge>
                )}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Business Information */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Información del Negocio
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Datos de la empresa para facturas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                        <form onSubmit={handleSubmit(handleBusinessSubmit)} className="space-y-3 sm:space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="businessName" className="flex items-center gap-2 text-sm">
                                    <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Nombre del Negocio
                                </Label>
                                <Input
                                    id="businessName"
                                    {...register('businessName')}
                                    className={`text-sm ${errors.businessName ? 'border-destructive' : ''}`}
                                />
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="rnc" className="text-sm">RNC</Label>
                                    <Input
                                        id="rnc"
                                        {...register('rnc')}
                                        className={`text-sm ${errors.rnc ? 'border-destructive' : ''}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono" className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="telefono"
                                        {...register('telefono')}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Dirección
                                </Label>
                                <Input
                                    id="direccion"
                                    {...register('direccion')}
                                    className="text-sm"
                                />
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website" className="flex items-center gap-2 text-sm">
                                        <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Sitio Web
                                    </Label>
                                    <Input
                                        id="website"
                                        {...register('website')}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logoUrl" className="text-sm">URL del Logo (Opcional)</Label>
                                <Input
                                    id="logoUrl"
                                    {...register('logoUrl')}
                                    placeholder="https://ejemplo.com/logo.png"
                                    className="text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">Pega la dirección de imagen de tu logo</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={saving}>
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Guardar Cambios
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Tax Configuration */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Configuración de Impuestos
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Ajusta los impuestos y moneda del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                        {/* ITBIS Toggle */}
                        <div className="space-y-3">
                            <ToggleSwitch
                                checked={settings.itbisEnabled}
                                onChange={(checked) => updateSettings({ itbisEnabled: checked })}
                                label="Aplicar ITBIS"
                                description="Habilitar impuesto a las ventas"
                            />

                            {settings.itbisEnabled && (
                                <div className="space-y-2 pl-0 sm:pl-4">
                                    <Label htmlFor="itbis" className="flex items-center gap-2 text-sm">
                                        <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                                        ITBIS (%)
                                    </Label>
                                    <Input
                                        id="itbis"
                                        type="number"
                                        step="0.1"
                                        value={settings.itbisRate}
                                        onChange={(e) => updateSettings({ itbisRate: parseFloat(e.target.value) || 0 })}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Propina Toggle */}
                        <div className="space-y-3">
                            <ToggleSwitch
                                checked={settings.propinaEnabled}
                                onChange={(checked) => updateSettings({ propinaEnabled: checked })}
                                label="Aplicar Propina Legal"
                                description="Agregar propina obligatoria"
                            />

                            {settings.propinaEnabled && (
                                <div className="space-y-2 pl-0 sm:pl-4">
                                    <Label htmlFor="propina" className="flex items-center gap-2 text-sm">
                                        <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Propina (%)
                                    </Label>
                                    <Input
                                        id="propina"
                                        type="number"
                                        step="0.1"
                                        value={settings.propinaRate}
                                        onChange={(e) => updateSettings({ propinaRate: parseFloat(e.target.value) || 0 })}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="moneda" className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                                Moneda
                            </Label>
                            <select
                                id="moneda"
                                value={settings.moneda}
                                onChange={(e) => updateSettings({ moneda: e.target.value as 'DOP' | 'USD' | 'EUR' })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="DOP">RD$ - Peso Dominicano</option>
                                <option value="USD">$ - Dólar Estadounidense</option>
                                <option value="EUR">€ - Euro</option>
                            </select>
                        </div>

                        <Button onClick={handleTaxSave} className="w-full" disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar Impuestos
                        </Button>
                    </CardContent>
                </Card>

                {/* Appearance */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Apariencia
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Personaliza el aspecto visual
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="space-y-1">
                            <ToggleSwitch
                                checked={theme === 'dark'}
                                onChange={handleDarkModeToggle}
                                label="Modo Oscuro"
                                description="Usar tema oscuro por defecto"
                            />
                            <Separator />
                            <ToggleSwitch
                                checked={settings.soundEnabled}
                                onChange={(checked) => updateSettings({ soundEnabled: checked })}
                                label="Sonidos"
                                description="Reproducir sonidos en eventos"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications & Receipts */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Notificaciones y Recibos
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Configura alertas e impresión
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="space-y-1">
                            <ToggleSwitch
                                checked={settings.notificationsEnabled}
                                onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
                                label="Notificaciones"
                                description="Mostrar alertas de bajo stock"
                            />
                            <Separator />
                            <ToggleSwitch
                                checked={settings.printReceipt}
                                onChange={(checked) => updateSettings({ printReceipt: checked })}
                                label="Imprimir Recibo"
                                description="Imprimir al completar venta"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Info */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Información del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
                        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground">Versión</p>
                            <p className="font-semibold text-sm sm:text-base">1.3.1</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground">Actualización</p>
                            <p className="font-semibold text-sm sm:text-base">28 Dic 2025</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground">Base de Datos</p>
                            <p className="font-semibold text-sm sm:text-base">Demo Mode</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground">Estado</p>
                            <Badge variant="success" className="mt-1">Activo</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
