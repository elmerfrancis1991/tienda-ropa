import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductosPage from './pages/productos/ProductosPage'
import POSPage from './pages/POSPage'
import ReportesPage from './pages/ReportesPage'
import HistorialFacturasPage from './pages/HistorialFacturasPage'
import CierreCajaPage from './pages/CierreCajaPage'
import UsuariosPage from './pages/UsuariosPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import AyudaPage from './pages/AyudaPage'

import { useState } from 'react'

export default function App() {
    // Staging Gate - persist in localStorage
    const [isStagingVerified, setIsStagingVerified] = useState(() => {
        return localStorage.getItem('stagingVerified') === 'true'
    })
    const isStaging = import.meta.env.VITE_APP_ENV === 'staging'

    const handleStagingVerification = (password: string) => {
        if (password === 'staging123') {
            localStorage.setItem('stagingVerified', 'true')
            setIsStagingVerified(true)
        }
    }

    if (isStaging && !isStagingVerified) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
                <div className="max-w-md w-full space-y-4 text-center">
                    <h1 className="text-2xl font-bold text-yellow-500">⚠ Ambiente de Staging ⚠</h1>
                    <p className="text-gray-400">Este entorno es solo para pruebas internas.</p>
                    <input
                        type="password"
                        placeholder="Contraseña de acceso"
                        className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                        onChange={(e) => handleStagingVerification(e.target.value)}
                    />
                </div>
            </div>
        )
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pos" element={<POSPage />} />
                <Route path="productos" element={<ProductosPage />} />
                <Route
                    path="reportes"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <ReportesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="usuarios"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <UsuariosPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="historial"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <HistorialFacturasPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="caja" element={<CierreCajaPage />} />
                <Route
                    path="configuracion"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <ConfiguracionPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="ayuda" element={<AyudaPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}
