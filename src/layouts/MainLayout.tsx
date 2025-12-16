import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TermsModal } from '@/components/TermsModal'

export default function MainLayout() {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto pt-14 lg:pt-4">
                <Outlet />
            </main>
            <TermsModal />
        </div>
    )
}
