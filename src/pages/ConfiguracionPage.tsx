import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Building2, Receipt, Palette, Database, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Badge } from '@/components/ui/badge'
import { APP_VERSION, LAST_UPDATE } from '@/version'

// Schema de validación
const businessSchema = z.object({
    businessName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    rnc: z.string().min(9, 'RNC inválido').max(11).optional().or(z.literal('')),
    telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
    direccion: z.string().optional(),
    impuestoPorcentaje: z.coerce.number().min(0).max(100),
    propinaPorcentaje: z.coerce.number().min(0).max(100),
    moneda: z.string().default('RD$'),
    // Campos opcionales para evitar errores si vienen del hook
    email: z.string().optional(),
    website: z.string().optional(),
    logoUrl: z.string().optional()
})

type BusinessFormValues = z.infer<typeof businessSchema>

export function ConfiguracionPage() {
    const { toast } = useToast()
    const { config, loading, saveConfig } = useConfiguracion()
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const form = useForm<BusinessFormValues>({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            businessName: '',
            rnc: '',
            telefono: '',
            direccion: '',
            impuestoPorcentaje: 18,
            propinaPorcentaje: 10,
            moneda: 'RD$'
        }
    })

    // Cargar configuración cuando esté lista
    useEffect(() => {
        if (!loading && config) {
            form.reset({
                businessName: config.businessName || '',
                rnc: config.rnc || '',
                telefono: config.telefono || '',
                direccion: config.direccion || '',
                impuestoPorcentaje: config.impuestoPorcentaje ?? 18,
                propinaPorcentaje: config.propinaPorcentaje ?? 10,
                moneda: config.moneda || 'RD$',
                logoUrl: config.logoUrl || ''
            })
        }
    }, [config, loading, form])

    const onSubmit = async (data: BusinessFormValues) => {
        try {
            await saveConfig(data)
            toast({
                title: "Configuración guardada",
                description: "Los cambios se han actualizado correctamente en el sistema.",
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios. Intente nuevamente.",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Cargando configuración...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Configuración</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Gestiona la información de tu negocio y preferencias del sistema.
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="sistema">Sistema</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    {/* Información del Negocio */}
                    <Card className="border-t-4 border-t-blue-600 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Información del Negocio
                            </CardTitle>
                            <CardDescription>
                                Datos principales de la empresa que aparecerán en los reportes y tickets.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="businessName">Nombre del Negocio</Label>
                                        <Input
                                            id="businessName"
                                            {...form.register('businessName')}
                                            placeholder="Ej: Tienda de Ropa Elite"
                                        />
                                        {form.formState.errors.businessName && (
                                            <p className="text-sm text-red-500">{form.formState.errors.businessName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rnc">RNC (Opcional)</Label>
                                        <Input
                                            id="rnc"
                                            {...form.register('rnc')}
                                            placeholder="Ingresa el RNC si aplica"
                                        />
                                        {form.formState.errors.rnc && (
                                            <p className="text-sm text-red-500">{form.formState.errors.rnc.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono">Teléfono</Label>
                                        <Input
                                            id="telefono"
                                            {...form.register('telefono')}
                                            placeholder="Ej: 809-555-0123"
                                        />
                                        {form.formState.errors.telefono && (
                                            <p className="text-sm text-red-500">{form.formState.errors.telefono.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="direccion">Dirección</Label>
                                        <Input
                                            id="direccion"
                                            {...form.register('direccion')}
                                            placeholder="Ej: Av. Winston Churchill #123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
                                        <Input
                                            id="logoUrl"
                                            {...form.register('logoUrl')}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Información
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Configuración Fiscal */}
                    <Card className="border-t-4 border-t-green-600 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-green-600" />
                                Impuestos y Moneda
                            </CardTitle>
                            <CardDescription>
                                Configuración de valores fiscales y formato de moneda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="impuesto">ITBIS / Impuesto (%)</Label>
                                        <div className="relative">
                                            <Input
                                                id="impuesto"
                                                type="number"
                                                {...form.register('impuestoPorcentaje')}
                                                min="0"
                                                max="100"
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="propina">Propina Legal (%)</Label>
                                        <div className="relative">
                                            <Input
                                                id="propina"
                                                type="number"
                                                {...form.register('propinaPorcentaje')}
                                                min="0"
                                                max="100"
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="moneda">Moneda</Label>
                                        <Select
                                            onValueChange={(value: string) => form.setValue('moneda', value)}
                                            defaultValue={form.getValues('moneda')}
                                            value={form.watch('moneda')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar moneda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RD$">Peso Dominicano (RD$)</SelectItem>
                                                <SelectItem value="USD$">Dólar Estadounidense (USD$)</SelectItem>
                                                <SelectItem value="€">Euro (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Fiscal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Apariencia */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                Apariencia
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Tema Oscuro</p>
                                    <p className="text-sm text-gray-500">Activar modo oscuro para la interfaz</p>
                                </div>
                                <Button variant="outline" onClick={toggleTheme}>
                                    {theme === 'dark' ? 'Desactivar' : 'Activar'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sistema" className="space-y-6">
                    <Card className="border-t-4 border-t-purple-600 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-purple-600" />
                                Información del Sistema
                            </CardTitle>
                            <CardDescription>
                                Detalles técnicos de la instalación actual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-500">Versión del Sistema</div>
                                    <div className="font-medium text-lg">{APP_VERSION}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-500">Tenant ID</div>
                                    <div className="font-mono text-sm break-all">{user?.tenantId}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-500">Estado</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-green-600">Activo</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="text-sm text-gray-500">Última Actualización</div>
                                    <div className="font-medium">{LAST_UPDATE}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ConfiguracionPage;
