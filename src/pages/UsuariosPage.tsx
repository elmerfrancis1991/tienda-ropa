import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Search,
    Shield,
    ShieldCheck,
    Mail,
    Calendar,
    Loader2,
    UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { User, UserRole, Permiso, PERMISOS_POR_ROL, PERMISOS_INFO, TODOS_LOS_PERMISOS } from '@/types'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const userSchema = z.object({
    nombre: z.string().min(3, 'Nombre muy corto').max(50),
    email: z.string().email('Email inválido'),
    role: z.enum(['admin', 'vendedor']),
    password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: UserFormData, permisos: Permiso[]) => Promise<void>
    user?: User | null
    isLoading?: boolean
}

export function UserFormModal({ open, onClose, onSubmit, user, isLoading }: UserFormModalProps) {
    const [selectedPermisos, setSelectedPermisos] = useState<Permiso[]>([])
    const [showPermisos, setShowPermisos] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: user ? {
            nombre: user.nombre,
            email: user.email,
            role: user.role,
        } : {
            nombre: '',
            email: '',
            role: 'vendedor',
        },
    })

    const currentRole = watch('role')

    // Reset form when user changes
    useEffect(() => {
        if (open) {
            reset(user ? {
                nombre: user.nombre,
                email: user.email,
                role: user.role,
            } : {
                nombre: '',
                email: '',
                role: 'vendedor',
                password: '',
            })
            // Set permisos: use user's custom permisos if available (even if empty), otherwise use role defaults
            if (user && Array.isArray(user.permisos)) {
                setSelectedPermisos(user.permisos as Permiso[])
            } else {
                const rolePermisos = PERMISOS_POR_ROL[user?.role || 'vendedor']
                setSelectedPermisos(rolePermisos)
            }
            setShowPermisos(false)
        }
    }, [open, user, reset])

    const handleFormSubmit = async (data: UserFormData) => {
        await onSubmit(data, selectedPermisos)
    }

    const togglePermiso = (permiso: Permiso) => {
        setSelectedPermisos(prev =>
            prev.includes(permiso)
                ? prev.filter(p => p !== permiso)
                : [...prev, permiso]
        )
    }

    // Group permisos by category
    const permisosByCategory = TODOS_LOS_PERMISOS.reduce((acc, permiso) => {
        const cat = PERMISOS_INFO[permiso].categoria
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(permiso)
        return acc
    }, {} as Record<string, Permiso[]>)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Actualiza la información del usuario' : 'Crea una nueva cuenta de usuario que podrá iniciar sesión'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo *</Label>
                        <Input
                            id="nombre"
                            autoComplete="off"
                            {...register('nombre')}
                            className={errors.nombre ? 'border-destructive' : ''}
                        />
                        {errors.nombre && (
                            <p className="text-sm text-destructive">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="off"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                            disabled={!!user} // No permitir editar email (no soportado por Auth)
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                        {user && (
                            <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rol *</Label>
                        <select
                            id="role"
                            {...register('role')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {!user && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña *</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="off"
                                {...register('password')}
                                className={errors.password ? 'border-destructive' : ''}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                El usuario podrá iniciar sesión con este correo y contraseña
                            </p>
                        </div>
                    )}

                    {/* Permisos Section - Solo para vendedores */}
                    {currentRole === 'vendedor' && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPermisos(!showPermisos)}
                                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                                <Shield className="h-4 w-4" />
                                {showPermisos ? 'Ocultar permisos' : 'Ver/editar permisos'}
                            </button>

                            {showPermisos && (
                                <div className="border rounded-lg p-3 space-y-3 max-h-60 overflow-y-auto">
                                    {Object.entries(permisosByCategory).map(([categoria, permisos]) => (
                                        <div key={categoria}>
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">{categoria}</p>
                                            <div className="grid grid-cols-2 gap-1">
                                                {permisos.map(permiso => (
                                                    <label
                                                        key={permiso}
                                                        className={cn(
                                                            "flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer hover:bg-muted/50",
                                                            selectedPermisos.includes(permiso) && "bg-primary/10"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermisos.includes(permiso)}
                                                            onChange={() => togglePermiso(permiso)}
                                                            className="rounded"
                                                        />
                                                        <span className="truncate">{PERMISOS_INFO[permiso].nombre}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {user ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function UsuariosPage() {
    const { hasPermiso } = useAuth()
    const { usuarios, loading, error, createUser, updateUser, deleteUser } = useUsuarios()
    const [searchTerm, setSearchTerm] = useState('')
    const [formOpen, setFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const filteredUsuarios = usuarios.filter(
        u => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateUser = async (data: UserFormData, permisos: Permiso[]) => {
        if (!data.password) {
            setFormError('La contraseña es requerida')
            return
        }

        // Validate max admins
        if (data.role === 'admin' && adminCount >= 2) {
            setFormError('Por seguridad, el sistema solo permite un máximo de 2 administradores.')
            return
        }

        setFormLoading(true)
        setFormError(null)

        try {
            await createUser({
                nombre: data.nombre,
                email: data.email,
                password: data.password,
                role: data.role as UserRole,
                permisos: permisos
            })
            setFormOpen(false)
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdateUser = async (data: UserFormData, permisos: Permiso[]) => {
        if (!editingUser) return

        // Validate max admins (only if promoting to admin)
        if (data.role === 'admin' && editingUser.role !== 'admin' && adminCount >= 2) {
            setFormError('Por seguridad, el sistema solo permite un máximo de 2 administradores.')
            return
        }

        setFormLoading(true)
        setFormError(null)

        try {
            await updateUser(editingUser.uid, {
                nombre: data.nombre,
                role: data.role as UserRole,
                permisos: permisos
            })
            setFormOpen(false)
            setEditingUser(null)
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return

        try {
            await deleteUser(userToDelete.uid)
            setUserToDelete(null)
            setDeleteDialogOpen(false)
        } catch (err) {
            console.error('Error deleting user:', err)
        }
    }

    const openEditForm = (user: User) => {
        setEditingUser(user)
        setFormError(null)
        setFormOpen(true)
    }

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    const closeForm = () => {
        setFormOpen(false)
        setEditingUser(null)
        setFormError(null)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(date)
    }

    const adminCount = usuarios.filter(u => u.role === 'admin').length
    const vendedorCount = usuarios.filter(u => u.role === 'vendedor').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-primary" />
                        Usuarios
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona las cuentas de usuario del sistema
                    </p>
                </div>
                {hasPermiso('usuarios:editar') && (
                    <Button onClick={() => { setFormError(null); setFormOpen(true) }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuevo Usuario
                    </Button>
                )}
            </div>

            {/* Error display */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4 text-destructive">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Usuarios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usuarios.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Administradores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adminCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Vendedores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vendedorCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <div className="grid gap-4">
                {filteredUsuarios.map((usuario) => (
                    <Card key={usuario.uid} className="hover:border-primary/30 transition-colors">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(usuario.nombre)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{usuario.nombre}</h3>
                                        <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                                            {usuario.role === 'admin' ? (
                                                <ShieldCheck className="h-3 w-3 mr-1" />
                                            ) : (
                                                <Shield className="h-3 w-3 mr-1" />
                                            )}
                                            {usuario.role === 'admin' ? 'Admin' : 'Vendedor'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {usuario.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(usuario.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {hasPermiso('usuarios:editar') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditForm(usuario)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {hasPermiso('usuarios:eliminar') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => openDeleteDialog(usuario)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredUsuarios.length === 0 && !loading && (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">No se encontraron usuarios</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un usuario'}
                        </p>
                        {!searchTerm && (
                            <Button className="mt-4" onClick={() => setFormOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Agregar Usuario
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* User Form Modal */}
            <UserFormModal
                open={formOpen}
                onClose={closeForm}
                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                user={editingUser}
                isLoading={formLoading}
            />

            {/* Form Error Toast */}
            {formError && formOpen && (
                <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg z-50">
                    {formError}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar usuario?</DialogTitle>
                        <DialogDescription>
                            Esta acción eliminará al usuario{' '}
                            <strong>{userToDelete?.nombre}</strong> del sistema.
                            El usuario ya no podrá iniciar sesión.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                            Eliminar Usuario
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
