import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, ImagePlus } from 'lucide-react'
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

const productoSchema = z.object({
    nombre: z.string().min(2, 'Nombre muy corto').max(100),
    descripcion: z.string().min(10, 'Descripción muy corta').max(500),
    precio: z.number().min(1, 'El precio debe ser mayor a 0'),
    costo: z.number().min(0, 'El costo no puede ser negativo').optional(),
    ganancia: z.number().optional(),
    stock: z.number().min(0, 'El stock no puede ser negativo'),
    categoria: z.string().min(1, 'Selecciona una categoría'),
    imagen: z.string().url('URL de imagen inválida').or(z.literal('')),
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
            categoria: '',
            imagen: '',
        },
    })

    // Cargar datos del producto cuando se abre el modal o cambia el producto
    useEffect(() => {
        if (open && producto) {
            // Resetear formulario con los valores del producto
            reset({
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                precio: producto.precio,
                costo: producto.costo || 0,
                ganancia: producto.ganancia || (producto.precio - (producto.costo || 0)),
                stock: producto.stock,
                categoria: producto.categoria,
                imagen: producto.imagen || '',
            })
            setSelectedTallas(producto.tallas || [])
            setSelectedColores(producto.colores || [])
        } else if (open && !producto) {
            // Nuevo producto - limpiar formulario
            reset({
                nombre: '',
                descripcion: '',
                precio: 0,
                costo: 0,
                ganancia: 0,
                stock: 0,
                categoria: '',
                imagen: '',
            })
            setSelectedTallas([])
            setSelectedColores([])
        }
    }, [open, producto, reset])

    const imagenUrl = watch('imagen')
    const precioActual = watch('precio')
    const costoActual = watch('costo')

    // Calculadoras inteligentes
    const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoCosto = parseFloat(e.target.value) || 0
        const gananciaActual = watch('ganancia') || 0

        // Si hay ganancia definida, actualizamos precio: Precio = Costo + Ganancia
        if (gananciaActual > 0) {
            setValue('precio', nuevoCosto + gananciaActual)
        }
        // Si hay precio definido pero no ganancia, actualizamos ganancia: Ganancia = Precio - Costo
        else if (precioActual > 0) {
            setValue('ganancia', precioActual - nuevoCosto)
        }
    }

    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoPrecio = parseFloat(e.target.value) || 0
        const costo = watch('costo') || 0

        // Al cambiar precio, recalculamos ganancia: Ganancia = Precio - Costo
        if (costo > 0) {
            setValue('ganancia', nuevoPrecio - costo)
        }
    }

    const handleGananciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevaGanancia = parseFloat(e.target.value) || 0
        const costo = watch('costo') || 0

        // Al cambiar ganancia, recalculamos precio: Precio = Costo + Ganancia
        if (costo > 0) {
            setValue('precio', costo + nuevaGanancia)
        }
    }

    const toggleTalla = (talla: string) => {
        setSelectedTallas((prev) =>
            prev.includes(talla) ? prev.filter((t) => t !== talla) : [...prev, talla]
        )
    }

    const toggleColor = (color: string) => {
        setSelectedColores((prev) =>
            prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
        )
    }

    const [submitError, setSubmitError] = useState<string | null>(null)

    const handleFormSubmit = async (data: ProductoFormData) => {
        if (selectedTallas.length === 0) {
            alert('Selecciona al menos una talla')
            return
        }
        if (selectedColores.length === 0) {
            alert('Selecciona al menos un color')
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)
        try {
            await onSubmit({
                ...data,
                tallas: selectedTallas,
                colores: selectedColores,
                activo: true,
            })
            reset()
            setSelectedTallas([])
            setSelectedColores([])
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
        setSelectedTallas(producto?.tallas || [])
        setSelectedColores(producto?.colores || [])
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {producto ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                    <DialogDescription>
                        {producto
                            ? 'Actualiza la información del producto'
                            : 'Completa el formulario para agregar un nuevo producto'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre del Producto *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Camisa Casual Azul"
                                {...register('nombre')}
                                className={errors.nombre ? 'border-destructive' : ''}
                            />
                            {errors.nombre && (
                                <p className="text-sm text-destructive">{errors.nombre.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <select
                                id="categoria"
                                {...register('categoria')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Seleccionar categoría</option>
                                {CATEGORIAS_ROPA.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.categoria && (
                                <p className="text-sm text-destructive">{errors.categoria.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción *</Label>
                        <textarea
                            id="descripcion"
                            placeholder="Describe el producto..."
                            {...register('descripcion')}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {errors.descripcion && (
                            <p className="text-sm text-destructive">{errors.descripcion.message}</p>
                        )}
                    </div>

                    {/* Price and Stocks */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {user?.role === 'admin' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="costo">Costo (RD$)</Label>
                                    <Input
                                        id="costo"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('costo', {
                                            valueAsNumber: true,
                                            onChange: handleCostoChange
                                        })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ganancia">Ganancia (RD$)</Label>
                                    <Input
                                        id="ganancia"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('ganancia', {
                                            valueAsNumber: true,
                                            onChange: handleGananciaChange
                                        })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="precio">Precio (RD$) *</Label>
                            <Input
                                id="precio"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register('precio', {
                                    valueAsNumber: true,
                                    onChange: handlePrecioChange
                                })}
                                className={errors.precio ? 'border-destructive' : ''}
                            />
                            {errors.precio && (
                                <p className="text-sm text-destructive">{errors.precio.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock *</Label>
                            <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                {...register('stock', { valueAsNumber: true })}
                                className={errors.stock ? 'border-destructive' : ''}
                            />
                            {errors.stock && (
                                <p className="text-sm text-destructive">{errors.stock.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Image */}
                    <div className="space-y-2">
                        <Label htmlFor="imagen">URL de Imagen</Label>
                        <div className="flex gap-3">
                            <Input
                                id="imagen"
                                placeholder="https://ejemplo.com/imagen.jpg"
                                {...register('imagen')}
                                className="flex-1"
                            />
                            {imagenUrl && (
                                <div className="w-16 h-10 rounded-md overflow-hidden border">
                                    <img
                                        src={imagenUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            ; (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tallas */}
                    <div className="space-y-2">
                        <Label>Tallas Disponibles *</Label>
                        <div className="flex flex-wrap gap-2">
                            {TALLAS.map((talla) => (
                                <Badge
                                    key={talla}
                                    variant={selectedTallas.includes(talla) ? 'default' : 'outline'}
                                    className="cursor-pointer transition-all hover:scale-105"
                                    onClick={() => toggleTalla(talla)}
                                >
                                    {talla}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Colores */}
                    <div className="space-y-2">
                        <Label>Colores Disponibles *</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORES.map((color) => (
                                <Badge
                                    key={color}
                                    variant={selectedColores.includes(color) ? 'default' : 'outline'}
                                    className="cursor-pointer transition-all hover:scale-105"
                                    onClick={() => toggleColor(color)}
                                >
                                    {color}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {submitError && (
                        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                            Error: {submitError}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {producto ? 'Guardar Cambios' : 'Crear Producto'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
