import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TermsModal } from '@/components/TermsModal'
import pkg from '../../package.json'

export default function MainLayout() {
    const isStaging = import.meta.env.MODE === 'staging';
    const version = pkg.version || '1.0.0';

    return (
        <div className="flex min-h-screen bg-background relative">
            {isStaging && (
                <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-xs font-bold text-center z-50 py-1 pointer-events-none opacity-90">
                    ⚠️ MODO STAGING (PRUEBAS) - DATOS SEPARADOS DE PRODUCCIÓN
                </div>
            )}

            {/* Indicador de Versión en la parte superior derecha */}
            <div className="fixed top-3 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-[10px] font-medium text-muted-foreground border shadow-sm select-none hover:bg-accent/80 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                v{version}
            </div>

            <Sidebar />
            <main className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-auto pt-14 lg:pt-4 ${isStaging ? 'mt-4' : ''}`}>
                <Outlet />
            </main>
            <TermsModal />
        </div>
    )
}
