// Types for the application

export type UserRole = 'admin' | 'vendedor'

export interface User {
    uid: string
    email: string
    nombre: string
    role: UserRole
    createdAt: Date
    photoURL?: string
    permisos?: string[] // Permisos personalizados del usuario
}

export interface Producto {
    id: string
    nombre: string
    descripcion: string
    precio: number
    costo?: number
    ganancia?: number
    stock: number
    categoria: string
    tallas: string[]
    colores: string[]
    imagen: string
    activo: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Categoria {
    id: string
    nombre: string
    descripcion?: string
}

export interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
}

export const CATEGORIAS_ROPA: Categoria[] = [
    { id: 'camisas', nombre: 'Camisas' },
    { id: 'pantalones', nombre: 'Pantalones' },
    { id: 'vestidos', nombre: 'Vestidos' },
    { id: 'faldas', nombre: 'Faldas' },
    { id: 'chaquetas', nombre: 'Chaquetas' },
    { id: 'accesorios', nombre: 'Accesorios' },
    { id: 'calzado', nombre: 'Calzado' },
    { id: 'ropa_interior', nombre: 'Ropa Interior' },
]

export const TALLAS: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const COLORES: string[] = [
    'Negro',
    'Blanco',
    'Azul',
    'Rojo',
    'Verde',
    'Amarillo',
    'Rosa',
    'Gris',
    'Marrón',
    'Beige',
]

// Sistema de Permisos Granulares
export type Permiso =
    | 'pos:vender'           // Puede realizar ventas
    | 'pos:descuentos'       // Puede aplicar descuentos
    | 'productos:ver'        // Puede ver productos
    | 'productos:editar'     // Puede editar productos
    | 'productos:eliminar'   // Puede eliminar productos
    | 'inventario:ver'       // Puede ver inventario
    | 'inventario:ajustar'   // Puede ajustar stock
    | 'reportes:ver'         // Puede ver reportes
    | 'usuarios:ver'         // Puede ver usuarios
    | 'usuarios:editar'      // Puede editar usuarios
    | 'caja:abrir'           // Puede abrir caja
    | 'caja:cerrar'          // Puede cerrar caja
    | 'caja:historial'       // Puede ver historial de caja
    | 'configuracion:ver'    // Puede ver configuracion
    | 'configuracion:editar' // Puede editar configuracion

// Permisos por defecto según rol
export const PERMISOS_POR_ROL: Record<UserRole, Permiso[]> = {
    admin: [
        'pos:vender', 'pos:descuentos',
        'productos:ver', 'productos:editar', 'productos:eliminar',
        'inventario:ver', 'inventario:ajustar',
        'reportes:ver',
        'usuarios:ver', 'usuarios:editar',
        'caja:abrir', 'caja:cerrar', 'caja:historial',
        'configuracion:ver', 'configuracion:editar'
    ],
    vendedor: [
        'pos:vender',
        'productos:ver',
        'inventario:ver',
        'caja:abrir', 'caja:cerrar'
    ]
}

// Usuario extendido con permisos personalizados
export interface UserWithPermisos extends User {
    permisosPersonalizados?: Permiso[]
}

// Cierre de Caja
export interface CierreCaja {
    id: string
    fecha: Date
    usuarioId: string
    usuarioNombre: string
    montoApertura: number
    montoCierre: number
    ventasEfectivo: number
    ventasTarjeta: number
    ventasTotal: number
    diferencia: number
    observaciones?: string
    estado: 'abierto' | 'cerrado'
    createdAt: Date
    closedAt?: Date
}

// Alerta de Inventario
export interface AlertaInventario {
    productoId: string
    productoNombre: string
    stockActual: number
    stockMinimo: number
    tipo: 'bajo' | 'agotado'
}

export const STOCK_MINIMO_DEFAULT = 5

// Información de permisos para UI
export const PERMISOS_INFO: Record<Permiso, { nombre: string; categoria: string }> = {
    'pos:vender': { nombre: 'Realizar ventas', categoria: 'Punto de Venta' },
    'pos:descuentos': { nombre: 'Aplicar descuentos', categoria: 'Punto de Venta' },
    'productos:ver': { nombre: 'Ver productos', categoria: 'Productos' },
    'productos:editar': { nombre: 'Editar productos', categoria: 'Productos' },
    'productos:eliminar': { nombre: 'Eliminar productos', categoria: 'Productos' },
    'inventario:ver': { nombre: 'Ver inventario', categoria: 'Inventario' },
    'inventario:ajustar': { nombre: 'Ajustar stock', categoria: 'Inventario' },
    'reportes:ver': { nombre: 'Ver reportes', categoria: 'Reportes' },
    'usuarios:ver': { nombre: 'Ver usuarios', categoria: 'Usuarios' },
    'usuarios:editar': { nombre: 'Editar usuarios', categoria: 'Usuarios' },
    'caja:abrir': { nombre: 'Abrir caja', categoria: 'Caja' },
    'caja:cerrar': { nombre: 'Cerrar caja', categoria: 'Caja' },
    'caja:historial': { nombre: 'Ver historial caja', categoria: 'Caja' },
    'configuracion:ver': { nombre: 'Ver configuración', categoria: 'Configuración' },
    'configuracion:editar': { nombre: 'Editar configuración', categoria: 'Configuración' },
}

// Lista de todos los permisos
export const TODOS_LOS_PERMISOS: Permiso[] = Object.keys(PERMISOS_INFO) as Permiso[]


