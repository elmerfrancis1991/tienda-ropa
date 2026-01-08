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
        reset,
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
        <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0F172A] to-black">
            <Card className="w-full max-w-md shadow-2xl border-white/5 bg-slate-900/80 backdrop-blur-md text-white">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">
                        {isRegistering ? 'Crear una Empresa' : 'Acceso al Sistema'}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {isRegistering
                            ? 'Registra tu negocio para comenzar'
                            : 'Ingresa tus credenciales para continuar'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {isRegistering && (
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-slate-200 font-semibold text-sm ml-1">
                                    Nombre de la Empresa
                                </Label>
                                <Input
                                    id="nombre"
                                    type="text"
                                    placeholder="Ej. Mi Tienda de Ropa"
                                    className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-primary/50"
                                    {...register('nombre')}
                                    autoComplete="off"
                                />
                                {errors.nombre && (
                                    <p className="text-xs text-red-400 ml-1 font-medium">{errors.nombre.message as string}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200 font-semibold text-sm ml-1">
                                Correo electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-11 focus:ring-primary/50"
                                {...register('email')}
                                autoComplete="new-email"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-400 ml-1 font-medium">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200 font-semibold text-sm ml-1">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10 focus:ring-primary/50"
                                    {...register('password')}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-400 ml-1 font-medium">{errors.password.message as string}</p>
                            )}
                        </div>

                        {!isRegistering && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsResetOpen(true)}
                                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                            type="submit"
                            disabled={isSubmitting || loading}
                        >
                            {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRegistering ? 'Crear Empresa' : 'Iniciar Sesión'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering)
                                reset({ email: '', password: '', nombre: '' })
                            }}
                            className="text-sm text-slate-400 hover:text-white transition-colors font-medium border-t border-white/5 pt-4 w-full"
                        >
                            {isRegistering
                                ? '¿Ya tienes una empresa? Inicia sesión'
                                : '¿No tienes cuenta? Registra tu empresa'}
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
