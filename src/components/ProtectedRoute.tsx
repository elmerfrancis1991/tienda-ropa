import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCierreCaja } from '@/hooks/useCierreCaja'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, loading, hasRole } = useAuth()
    const location = useLocation()
    const [showTimeout, setShowTimeout] = useState(false)

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (loading) {
            timer = setTimeout(() => {
                setShowTimeout(true)
            }, 10000) // 10 segundos
        }
        return () => clearTimeout(timer)
    }, [loading])

    if (loading) {
        if (showTimeout) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold">Tiempo de espera agotado</h2>
                        <p className="text-muted-foreground">
                            El sistema de autenticación está tardando demasiado en responder.
                            Esto puede deberse a una conexión a internet lenta o problemas de configuración.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    // 1. Redirigir al login si no hay usuario
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 2. Redirigir por rol si es necesario
    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/dashboard" replace />
    }

    return <CashDrawerGuard>{children}</CashDrawerGuard>
}

// Sub-componente para manejar el estado de la caja de forma aislada
function CashDrawerGuard({ children }: { children: React.ReactNode }) {
    const { isCajaAbierta, loading: loadingCaja } = useCierreCaja()
    const location = useLocation()

    if (loadingCaja) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Si la caja está cerrada y NO estamos en la página de caja, redirigir a caja
    if (!isCajaAbierta && location.pathname !== '/caja') {
        return <Navigate to="/caja" replace />
    }

    return <>{children}</>
}
