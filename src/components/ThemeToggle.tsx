import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
    collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={toggleTheme}
            className="w-full justify-start gap-3"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {theme === 'dark' ? (
                <>
                    <Sun className="h-5 w-5 text-yellow-500" />
                    {!collapsed && <span>Modo Claro</span>}
                </>
            ) : (
                <>
                    <Moon className="h-5 w-5 text-blue-500" />
                    {!collapsed && <span>Modo Oscuro</span>}
                </>
            )}
        </Button>
    )
}
