import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TermsModal } from '@/components/TermsModal'

export default function MainLayout() {
    const isStaging = import.meta.env.MODE === 'staging';

    return (
        <div className="flex min-h-screen bg-background relative">
            {isStaging && (
                <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-xs font-bold text-center z-50 py-1 pointer-events-none opacity-90">
                    ⚠️ MODO STAGING (PRUEBAS) - DATOS SEPARADOS DE PRODUCCIÓN
                </div>
            )}
            <Sidebar />
            <main className={`flex-1 p-3 sm:p-4 lg:p-6 overflow-auto pt-14 lg:pt-4 ${isStaging ? 'mt-4' : ''}`}>
                <Outlet />
            </main>
            <TermsModal />
        </div>
    )
}
