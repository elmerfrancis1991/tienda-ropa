import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, ImagePlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Producto, CATEGORIAS_ROPA, TALLAS, COLORES } from '@/types'
import { generateId } from '@/lib/utils'

const productoSchema = z.object({
    nombre: z.string().min(2, 'Nombre muy corto').max(100),
    descripcion: z.string().min(10, 'Descripción muy corta').max(500),
    precio: z.number().min(1, 'El precio debe ser mayor a 0'),
    costo: z.number().min(0, 'El costo no puede ser negativo').optional(),
    ganancia: z.number().optional(),
    stock: z.number().min(1, 'El stock inicial debe ser mayor a 0'),
    minStock: z.number().min(1, 'Mínimo 1').optional(),
    categoria: z.string().min(1, 'Selecciona una categoría'),
    imagen: z.string().url('URL de imagen inválida').or(z.literal('')),
    // For single edit mode
    talla: z.string().optional(),
    color: z.string().optional(),
    codigoBarra: z.string().optional(),
})

type ProductoFormData = z.infer<typeof productoSchema>

interface ProductoFormProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    producto?: Producto | null
}

export function ProductoForm({ open, onClose, onSubmit, producto }: ProductoFormProps) {
    const { user } = useAuth()
    const [selectedTallas, setSelectedTallas] = useState<string[]>([])
    const [selectedColores, setSelectedColores] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [variantStocks, setVariantStocks] = useState<Record<string, number>>({})
    const [generatedCount, setGeneratedCount] = useState(0)

    const isEditing = !!producto

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<ProductoFormData>({
        resolver: zodResolver(productoSchema),
        defaultValues: {
            nombre: '',
            descripcion: '',
            precio: 0,
            costo: 0,
            ganancia: 0,
            stock: 0,
            minStock: 5,
            categoria: '',
            imagen: '',
            codigoBarra: '',
        },
    })

    // Load data
    useEffect(() => {
        if (open && producto) {
            // Edit Mode: Load single product data
            reset({
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                precio: producto.precio,
                costo: producto.costo || 0,
                ganancia: producto.ganancia || (producto.precio - (producto.costo || 0)),
                stock: producto.stock,
                minStock: producto.minStock || 5,
                categoria: producto.categoria,
                imagen: producto.imagen || '',
                talla: producto.talla,
                color: producto.color,
                codigoBarra: producto.codigoBarra || '',
            })
            // In edit mode, arrays are ignored, we bind to specific talla/color
            setSelectedTallas([producto.talla || ''])
            setSelectedColores([producto.color || ''])
        } else if (open && !producto) {
            // Create Mode
            reset({
                nombre: '',
                descripcion: '',
                precio: 0,
                costo: 0,
                ganancia: 0,
                stock: 0,
                minStock: 5,
                categoria: '',
                imagen: '',
                codigoBarra: '',
            })
            setSelectedTallas([])
            setSelectedColores([])
            setVariantStocks({})
            setGeneratedCount(0)
        }
    }, [open, producto, reset])

    // Calc generated count
    useEffect(() => {
        if (!isEditing) {
            setGeneratedCount(selectedTallas.length * selectedColores.length)
        }
    }, [selectedTallas, selectedColores, isEditing])

    const imagenUrl = watch('imagen')
    const precioActual = watch('precio')

    // Calculadoras inteligentes
    const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoCosto = parseFloat(e.target.value) || 0
        const gananciaActual = watch('ganancia') || 0
        if (gananciaActual > 0) setValue('precio', nuevoCosto + gananciaActual)
        else if (precioActual > 0) setValue('ganancia', precioActual - nuevoCosto)
    }

    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoPrecio = parseFloat(e.target.value) || 0
        const costo = watch('costo') || 0
        if (costo > 0) setValue('ganancia', nuevoPrecio - costo)
    }

    const handleGananciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevaGanancia = parseFloat(e.target.value) || 0
        const costo = watch('costo') || 0
        if (costo > 0) setValue('precio', costo + nuevaGanancia)
    }

    const toggleTalla = (talla: string) => {
        if (isEditing) return // Prevent toggling in edit mode 
        setSelectedTallas((prev) =>
            prev.includes(talla) ? prev.filter((t) => t !== talla) : [...prev, talla]
        )
    }

    const toggleColor = (color: string) => {
        if (isEditing) return
        setSelectedColores((prev) =>
            prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
        )
    }

    const handleVariantStockChange = (talla: string, color: string, stock: number) => {
        const key = `${talla}-${color}`
        setVariantStocks(prev => ({ ...prev, [key]: stock }))
    }

    const [submitError, setSubmitError] = useState<string | null>(null)

    const handleFormSubmit = async (data: ProductoFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            if (isEditing && producto) {
                // Update Single Product
                await onSubmit({
                    ...data,
                    // Use form values or fallback to existing
                    talla: data.talla || producto.talla || 'Unica',
                    color: data.color || producto.color || 'Unico',
                    // ParentId stays same
                    parentId: producto.parentId,
                    activo: true,
                    codigoBarra: data.codigoBarra || '', // Update barcode
                    tenantId: producto.tenantId, // Should persist
                } as any)
            } else {
                // Create New Variants
                if (selectedTallas.length === 0) {
                    throw new Error('Selecciona al menos una talla')
                }
                if (selectedColores.length === 0) {
                    throw new Error('Selecciona al menos un color')
                }

                // --- CALCULAR SUMA DE VARIANTES ---
                const totalVariants = selectedTallas.length * selectedColores.length
                let totalStockAsignado = 0

                // Sumar los stocks asignados manualmente
                for (const talla of selectedTallas) {
                    for (const color of selectedColores) {
                        const key = `${talla}-${color}`
                        // Usar 0 si no hay asignación manual (no auto-rellenar con data.stock)
                        totalStockAsignado += variantStocks[key] ?? 0
                    }
                }

                if (totalStockAsignado > data.stock) {
                    throw new Error(`La suma de las variantes (${totalStockAsignado}) no puede ser mayor al Stock Inicial (${data.stock})`)
                }

                // Si el usuario no asignó stock a ninguna variante, mostrar error
                if (totalStockAsignado === 0) {
                    throw new Error('Debes asignar stock a al menos una variante. El stock no se asigna automáticamente.')
                }

                // Si el usuario puso un stock inicial pero no asignó individuales, 
                // tal vez quiere que el stock inicial se reparta? 
                // Pero según el prompt: "no debe permitit que las cantidades de las variantes sean mas que el stock inicial"
                // Así que validamos el techo.

                const parentId = generateId()
                const baseBarcode = data.codigoBarra?.trim() || ''

                const promises = []
                for (const talla of selectedTallas) {
                    for (const color of selectedColores) {
                        const variantKey = `${talla}-${color}`
                        const specificStock = variantStocks[variantKey] ?? 0

                        const variantBarcode = baseBarcode
                            ? `${baseBarcode}-${talla}-${color}`.toUpperCase().replace(/\s+/g, '')
                            : ''

                        const variantData = {
                            ...data,
                            stock: specificStock, // Use specific stock
                            talla,
                            color,
                            parentId,
                            activo: true,
                            codigoBarra: variantBarcode,
                            tenantId: user?.tenantId || 'default',
                        }
                        promises.push(onSubmit(variantData as any))
                    }
                }

                await Promise.all(promises)
            }

            reset()
            setSelectedTallas([])
            setSelectedColores([])
            setVariantStocks({})
            onClose()
        } catch (error) {
            console.error('Error submitting product:', error)
            setSubmitError(error instanceof Error ? error.message : 'Error desconocido al guardar')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Variante' : 'Nuevo Producto (Generador de Variantes)'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Actualiza los datos de este artículo específico.'
                            : 'Genera múltiples artículos automáticamente combinando tallas y colores.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Base *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Camisa Casual"
                                {...register('nombre')}
                                className={errors.nombre ? 'border-destructive' : ''}
                            />
                            {errors.nombre && (
                                <p className="text-sm text-destructive">{errors.nombre.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Input
                                id="categoria"
                                list="categorias-list"
                                placeholder="Selecciona..."
                                {...register('categoria')}
                                className={errors.categoria ? 'border-destructive' : ''}
                            />
                            <datalist id="categorias-list">
                                {CATEGORIAS_ROPA.map((cat) => (
                                    <option key={cat.id} value={cat.nombre} />
                                ))}
                            </datalist>
                            {errors.categoria && (
                                <p className="text-sm text-destructive">{errors.categoria.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción *</Label>
                        <textarea
                            id="descripcion"
                            placeholder="Detalles del producto..."
                            {...register('descripcion')}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Barcode */}
                        <div className="space-y-2">
                            <Label htmlFor="codigoBarra">
                                {isEditing ? 'Código de Barra' : 'Código Base (Prefijo)'}
                            </Label>
                            <Input
                                id="codigoBarra"
                                placeholder={isEditing ? "Escanea..." : "Ej: CAMISA001"}
                                {...register('codigoBarra')}
                            />
                            {!isEditing && (
                                <p className="text-[10px] text-muted-foreground">
                                    Se generará: CÓDIGO-TALLA-COLOR
                                </p>
                            )}
                        </div>
                        {/* Image */}
                        <div className="space-y-2">
                            <Label htmlFor="imagen">URL de Imagen</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="imagen"
                                    placeholder="https://..."
                                    {...register('imagen')}
                                    className="flex-1"
                                />
                                {imagenUrl && (
                                    <div className="w-10 h-10 rounded border overflow-hidden shrink-0">
                                        <img src={imagenUrl} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price and Stocks */}
                    <div className="grid gap-4 md:grid-cols-3 bg-muted/30 p-4 rounded-lg">
                        {user?.role === 'admin' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="costo">Costo (RD$)</Label>
                                    <Input
                                        id="costo"
                                        type="number"
                                        step="0.01"
                                        {...register('costo', { valueAsNumber: true, onChange: handleCostoChange })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ganancia">Ganancia</Label>
                                    <Input
                                        id="ganancia"
                                        type="number"
                                        step="0.01"
                                        {...register('ganancia', { valueAsNumber: true, onChange: handleGananciaChange })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="precio">Precio Venta (RD$) *</Label>
                            <Input
                                id="precio"
                                type="number"
                                step="0.01"
                                {...register('precio', { valueAsNumber: true, onChange: handlePrecioChange })}
                                className={errors.precio ? 'border-destructive font-bold' : 'font-bold'}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Total Inicial *</Label>
                            <Input
                                id="stock"
                                type="number"
                                {...register('stock', { valueAsNumber: true })}
                                placeholder="Total de todas las variantes"
                            />
                            <p className="text-[10px] text-muted-foreground">La suma de variantes no puede exceder este total</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minStock">Min. Stock</Label>
                            <Input
                                id="minStock"
                                type="number"
                                {...register('minStock', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {/* Variants Generation */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Variantes</Label>
                            {!isEditing && generatedCount > 0 && (
                                <Badge variant="secondary">
                                    Se crearán {generatedCount} productos
                                </Badge>
                            )}
                        </div>

                        {/* Tallas */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Tallas Disponibles</Label>
                            <div className="flex flex-wrap gap-2">
                                {isEditing ? (
                                    // Single Select for Edit
                                    <select
                                        {...register('talla')}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : (
                                    // Multi Select for Create
                                    TALLAS.map((talla) => (
                                        <Badge
                                            key={talla}
                                            variant={selectedTallas.includes(talla) ? 'default' : 'outline'}
                                            className="cursor-pointer hover:scale-105 active:scale-95 select-none"
                                            onClick={() => toggleTalla(talla)}
                                        >
                                            {talla}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Colores */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Colores Disponibles</Label>
                            <div className="flex flex-wrap gap-2">
                                {isEditing ? (
                                    <select
                                        {...register('color')}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {COLORES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    COLORES.map((color) => (
                                        <Badge
                                            key={color}
                                            variant={selectedColores.includes(color) ? 'default' : 'outline'}
                                            className="cursor-pointer hover:scale-105 active:scale-95 select-none"
                                            onClick={() => toggleColor(color)}
                                        >
                                            {color}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Inventory per Variant list */}
                        {!isEditing && selectedTallas.length > 0 && selectedColores.length > 0 && (
                            <div className="mt-4 space-y-3 bg-muted/50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" />
                                    Cantidades por Variante (Asignación Manual)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Asigna manualmente el stock para cada variante. La suma no puede exceder el Stock Total Inicial.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                    {selectedTallas.map(t =>
                                        selectedColores.map(c => {
                                            const key = `${t}-${c}`
                                            return (
                                                <div key={key} className="flex items-center justify-between gap-3 p-2 bg-background rounded border">
                                                    <span className="text-xs font-medium">
                                                        {t} / {c}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-20 text-xs"
                                                        placeholder="0"
                                                        value={variantStocks[key] ?? ''}
                                                        onChange={(e) => handleVariantStockChange(t, c, parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {submitError && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {submitError}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar Cambios' : `Crear ${generatedCount > 0 ? generatedCount + ' ' : ''}Productos`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
