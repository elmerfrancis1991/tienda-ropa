import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    nombre: z.string().optional().or(z.literal('')),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login, register: registerUser, loading, error, resetPassword } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Reset Password State
    const [isResetOpen, setIsResetOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const from = location.state?.from?.pathname || '/dashboard'

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            nombre: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            if (isRegistering) {
                if (!data.nombre) return
                await registerUser(data.email, data.password, data.nombre)
                navigate(from, { replace: true })
            } else {
                await login(data.email, data.password)
                navigate(from, { replace: true })
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetEmail) return

        setResetLoading(true)
        setResetMessage(null)

        try {
            await resetPassword(resetEmail)
            setResetMessage({
                type: 'success',
                text: 'Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.'
            })
            setTimeout(() => {
                setIsResetOpen(false)
                setResetMessage(null)
                setResetEmail('')
            }, 3000)
        } catch (err: any) {
            setResetMessage({
                type: 'error',
                text: err.message || 'Error al enviar correo de recuperación'
            })
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}
                    </CardTitle>
                    <CardDescription>
                        {isRegistering
                            ? 'Ingresa tus datos para registrarte'
                            : 'Ingresa tus credenciales para acceder'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {isRegistering && (
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre Completo</Label>
                                <Input
                                    id="nombre"
                                    type="text"
                                    placeholder="Ej. Juan Pérez"
                                    {...register('nombre')}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-red-500">{errors.nombre.message as string}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nombre@empresa.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message as string}</p>
                            )}
                        </div>

                        {!isRegistering && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsResetOpen(true)}
                                    className="text-sm font-medium text-primary hover:text-primary/90"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded bg-red-50 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <Button className="w-full" type="submit" disabled={isSubmitting || loading}>
                            {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRegistering ? 'Registrarse' : 'Ingresar'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            {isRegistering
                                ? '¿Ya tienes cuenta? Inicia sesión'
                                : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recuperar Contraseña</DialogTitle>
                        <DialogDescription>
                            Te enviaremos un enlace a tu correo para restablecer tu contraseña.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Correo electrónico</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="nombre@empresa.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </div>
                        {resetMessage && (
                            <div className={`p-3 rounded-md text-sm ${resetMessage.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                                }`}>
                                {resetMessage.text}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleResetPassword} disabled={resetLoading}>
                            {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
