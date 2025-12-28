import { z } from 'zod';

// 1. Esquema de Producto (DB Integrity)
export const productSchema = z.object({
    nombre: z.string()
        .min(1, 'El nombre es requerido')
        .max(100, 'El nombre es muy largo')
        .refine(val => !/<script|onload|javascript:/i.test(val), 'Intento de XSS detectado'), // Seguridad XSS
    precio: z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(Number.MAX_SAFE_INTEGER, 'El precio excede el límite seguro'), // DB Integrity & Overflow
    stock: z.number()
        .int()
        .min(0, 'El stock no puede ser negativo')
        .max(Number.MAX_SAFE_INTEGER, 'Stock inválido'),
    categoria: z.string().optional()
});

// 2. Esquema de Usuario (Security)
export const userRoleSchema = z.object({
    role: z.enum(['admin', 'vendedor', 'cajero'])
});

// 3. Validacion de Inputs (Security)
export const emailSchema = z.string()
    .email('Email inválido')
    .max(100, 'Email muy largo'); // Input Validation

export const passwordSchema = z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'Contraseña muy larga');

// Helper para sanitizar
export const sanitizeInput = (input: string) => {
    // Remove tags and dangerous protocols
    return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '');
};

// Helper para validar rol de admin (simulado para tests unitarios)
export const canPromoteToAdmin = (currentUserRole: string, targetRole: string) => {
    if (targetRole === 'admin' && currentUserRole !== 'admin') return false; // Privilege Escalation Check
    return true;
};
