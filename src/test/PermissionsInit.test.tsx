import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { UserFormModal } from '../pages/UsuariosPage'
import { User, Permiso, TODOS_LOS_PERMISOS, PERMISOS_INFO } from '../types'

// Mock Dialog components since they rely on Radix UI context which might be tricky in pure unit test without setup
// But since we use Shadcn/Radix, simple rendering usually works if we don't assume too much about implementation.
// However, to keep it simple, we trust the Dialog renders its children when open=true.

describe('UserFormModal Permission Logic', () => {
    afterEach(() => {
        cleanup()
    })

    const mockClose = () => { }
    const mockSubmit = async () => { }

    it('should respect empty permission array (revoked permissions) and NOT load defaults', async () => {
        // User with role 'vendedor' but explicitly empty permissions
        const restrictedUser: User = {
            uid: '123',
            email: 'test@test.com',
            nombre: 'Test User',
            role: 'vendedor',
            createdAt: new Date(),
            permisos: [], // EMPTY ARRAY - Should be respected
            tenantId: 'default'
        }

        render(
            <UserFormModal
                open={true}
                onClose={mockClose}
                onSubmit={mockSubmit}
                user={restrictedUser}
            />
        )

        // Find "Ocultar permisos" or "Ver/editar permisos" button to know it's rendered
        const toggleButton = screen.getByText(/Ver\/editar permisos/i)
        expect(toggleButton).toBeInTheDocument()

        // Click it to show permissions
        toggleButton.click()

        // Now check if checkboxes are checked or unchecked.
        // A default 'vendedor' has 'vender' permission.
        // Our restrictedUser has [], so 'vender' should be UNCHECKED.

        // Note: We need to find the checkbox for 'Vender' (or whatever name 'ventas:crear' has)
        // Let's assume 'ventas:crear' maps to 'Realizar ventas' or similar in PERMISOS_INFO.
        // We can check the PERMISOS_INFO import or just look for the text of a known default permission.

        // Since we import types, let's use them.
        const defaultVendedorPermiso: Permiso = 'pos:vender' // Standard default
        const nombrePermiso = PERMISOS_INFO[defaultVendedorPermiso]?.nombre || 'Realizar ventas'

        const checkbox = await screen.findByLabelText(nombrePermiso) as HTMLInputElement

        // ASSERTION: Should be unchecked
        expect(checkbox.checked).toBe(false)
    })

    it('should load default permissions if user has undefined permissions', async () => {
        // User with role 'vendedor' and undefined permissions (legacy or new)
        const defaultUser: User = {
            uid: '456',
            email: 'default@test.com',
            nombre: 'Default User',
            role: 'vendedor',
            createdAt: new Date(),
            permisos: undefined, // Undefined - Should load defaults
            tenantId: 'default'
        }

        render(
            <UserFormModal
                open={true}
                onClose={mockClose}
                onSubmit={mockSubmit}
                user={defaultUser}
            />
        )

        const toggleButton = screen.getByText(/Ver\/editar permisos/i)
        toggleButton.click()

        const defaultVendedorPermiso: Permiso = 'pos:vender'
        const nombrePermiso = PERMISOS_INFO[defaultVendedorPermiso]?.nombre || 'Realizar ventas'

        const checkbox = await screen.findByLabelText(nombrePermiso) as HTMLInputElement

        // ASSERTION: Should be checked (Default)
        expect(checkbox.checked).toBe(true)
    })
})
