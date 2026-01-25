import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TermsModal } from '@/components/TermsModal'
import { APP_VERSION } from '@/version'
import { useAuth } from '@/contexts/AuthContext'
import { useCierreCaja } from '@/hooks/useCierreCaja'
import { WifiOff } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import ReloadPrompt from '@/components/ReloadPrompt'

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10 minutes

export default function MainLayout() {
    const isStaging = import.meta.env.MODE === 'staging';
    const version = APP_VERSION;
    const { isCajaAbierta, loading } = useCierreCaja();
    const { logout } = useAuth(); // Import logout
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-logout logic
    const handleLogout = useCallback(() => {
        console.warn("⚠️ Sesión cerrada por inactividad (10 min).")
        logout();
        window.location.href = '/login'; // Force redirect
    }, [logout]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
        };

        // Events to listen for
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Initial setup
        resetTimer();

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [handleLogout]);

    const forceUpdate = () => {
        if (confirm('¿Deseas forzar la actualización del sistema? Esto limpiará la memoria caché.')) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const registration of registrations) {
                        registration.unregister()
                    }
                    window.location.reload()
                })
            } else {
                window.location.reload()
            }
        }
    }

    return (
        <div className="flex min-h-screen bg-background relative">
            {isStaging && (
                <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-xs font-bold text-center z-50 py-1 pointer-events-none opacity-90">
                    ⚠️ MODO STAGING (PRUEBAS) - DATOS SEPARADOS DE PRODUCCIÓN
                </div>
            )}

            {isOffline && (
                <div className="fixed top-0 left-0 right-0 bg-neutral-800 text-white text-[10px] font-bold text-center z-[60] py-0.5 flex items-center justify-center gap-2 border-b border-white/10">
                    <WifiOff className="h-3 w-3 text-red-500" />
                    MODO OFFLINE - LAS VENTAS SE SINCRONIZARÁN AL VOLVER LA CONEXIÓN
                </div>
            )}

            {/* Aviso de Caja Cerrada */}
            {!loading && !isCajaAbierta && (
                <div className={`fixed ${isStaging ? 'top-6' : 'top-0'} left-0 right-0 bg-red-600 text-white text-xs font-bold text-center z-50 py-1 animate-pulse`}>
                    ⚠️ CAJA CERRADA - DEBE ABRIR CAJA PARA FACTURAR
                </div>
            )}

            {/* Indicador de Versión en la parte superior derecha */}
            <div className="fixed top-3 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-[10px] font-medium text-muted-foreground border shadow-sm select-none hover:bg-accent/80 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                v{version}
                <button
                    onClick={forceUpdate}
                    className="ml-2 pl-2 border-l border-muted-foreground/30 hover:text-primary transition-colors cursor-pointer"
                    title="Forzar actualización de caché"
                >
                    Actualizar
                </button>
            </div>

            <Sidebar />
            <main className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-auto pt-14 lg:pt-4 ${isStaging ? 'mt-4' : ''}`}>
                <Outlet />
            </main>
            <TermsModal />
            <ReloadPrompt />
        </div>
    )
}
