import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useConfig } from '@/contexts/ConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { UserRole, Permiso } from '@/types'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Store,
    BarChart3,
    Moon,
    Sun,
    Menu,
    X,
    FileText,
    Wallet,
    Boxes,
    HelpCircle,
} from 'lucide-react'

interface NavItem {
    title: string
    href: string
    icon: React.ElementType
    requiredRole?: UserRole
    requiredPermiso?: Permiso
}

const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Punto de Venta', href: '/pos', icon: ShoppingCart, requiredPermiso: 'pos:vender' },
    { title: 'Inventario', href: '/productos', icon: Package, requiredPermiso: 'productos:ver' },
    { title: 'Caja', href: '/caja', icon: Wallet, requiredPermiso: 'caja:abrir' },
    { title: 'Reportes', href: '/reportes', icon: BarChart3, requiredPermiso: 'reportes:ver' },
    { title: 'Historial de Ventas', href: '/historial', icon: FileText, requiredPermiso: 'caja:historial' },
    { title: 'Usuarios', href: '/usuarios', icon: Users, requiredPermiso: 'usuarios:ver' },
    { title: 'Configuración', href: '/configuracion', icon: Settings, requiredPermiso: 'configuracion:ver' },
    { title: 'Ayuda', href: '/ayuda', icon: HelpCircle },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout, hasRole, hasPermiso } = useAuth()
    const { settings } = useConfig()
    const { theme, toggleTheme } = useTheme()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const filteredNavItems = navItems.filter((item) => {
        // Si requiere un rol específico y no lo tiene
        if (item.requiredRole && !hasRole(item.requiredRole)) return false

        // Si requiere un permiso específico y no lo tiene
        if (item.requiredPermiso && !hasPermiso(item.requiredPermiso)) return false

        return true
    })

    const handleNavClick = () => {
        setMobileOpen(false)
    }

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-3 sm:p-4 flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    )}
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="font-bold text-base sm:text-lg gradient-text truncate">
                            {user?.empresaNombre || settings.businessName || 'Tienda POS'}
                        </h1>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Sistema de Ventas</p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={handleNavClick}
                            className={cn(
                                'flex items-center gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                    )
                })}
            </nav>

            <Separator />

            {/* Theme Toggle */}
            <div className="p-2 sm:p-3">
                <Button
                    variant="ghost"
                    className={cn(
                        'w-full justify-start gap-3 text-muted-foreground hover:text-foreground text-xs sm:text-sm h-9 sm:h-10',
                        collapsed && 'px-0 justify-center'
                    )}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />
                            {!collapsed && <span>Modo Claro</span>}
                        </>
                    ) : (
                        <>
                            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                            {!collapsed && <span>Modo Oscuro</span>}
                        </>
                    )}
                </Button>
            </div>

            <Separator />

            {/* User section */}
            <div className="p-2 sm:p-3">
                <div
                    className={cn(
                        'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-accent/50',
                        collapsed && 'justify-center'
                    )}
                >
                    <Avatar className="h-7 w-7 sm:h-9 sm:w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                            {user ? getInitials(user.nombre) : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs sm:text-sm font-medium truncate">{user?.nombre}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                                {user?.role} {user?.empresaNombre && `• ${user.empresaNombre}`}
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    className={cn(
                        'w-full mt-2 text-muted-foreground hover:text-destructive text-xs sm:text-sm h-9 sm:h-10',
                        collapsed && 'px-0'
                    )}
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
                </Button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-3 left-3 z-40 lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-md"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-3 right-3 p-2 rounded-lg hover:bg-accent"
                >
                    <X className="h-5 w-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden lg:flex h-screen bg-card border-r border-border flex-col transition-sidebar relative',
                    collapsed ? 'w-[70px]' : 'w-[240px] xl:w-[260px]'
                )}
            >
                {/* Collapse button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:bg-accent transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>

                <SidebarContent />
            </aside>
        </>
    )
}
