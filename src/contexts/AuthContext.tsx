import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User, UserRole, AuthState, Permiso, PERMISOS_POR_ROL } from '@/types'

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, nombre: string) => Promise<void>
    logout: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    hasRole: (role: UserRole) => boolean
    hasPermiso: (permiso: Permiso) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users removed - using real Firebase Auth


export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    })

    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (unsubscribeDoc) {
                unsubscribeDoc()
                unsubscribeDoc = null
            }

            if (firebaseUser) {
                // Listen to the user document in real-time
                const userRef = doc(db, 'users', firebaseUser.uid)

                unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data()
                        setState({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                nombre: userData.nombre || firebaseUser.displayName || 'Usuario',
                                role: userData.role || 'vendedor',
                                tenantId: userData.tenantId || 'default',
                                empresaNombre: userData.empresaNombre || undefined,
                                createdAt: userData.createdAt?.toDate() || new Date(),
                                photoURL: firebaseUser.photoURL || undefined,
                                permisos: userData.permisos || undefined
                            },
                            loading: false,
                            error: null
                        })
                    } else {
                        // If no firestore doc, plain User data (fallback)
                        setState({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                nombre: firebaseUser.displayName || 'Usuario Nuevo',
                                role: 'vendedor',
                                tenantId: 'default', // Multi-tenant default
                                createdAt: new Date()
                            },
                            loading: false,
                            error: null
                        })
                    }
                }, (error) => {
                    console.error("Error listening to user doc:", error)
                    setState(prev => ({ ...prev, loading: false }))
                })
            } else {
                setState({ user: null, loading: false, error: null })
            }
        })

        return () => {
            unsubscribeAuth()
            if (unsubscribeDoc) unsubscribeDoc()
        }
    }, [])

    const login = async (email: string, password: string) => {
        console.log('🔐 [LOGIN] Iniciando login para:', email)
        setState(prev => ({ ...prev, loading: true, error: null }))
        try {
            console.log('🔐 [LOGIN] Llamando signInWithEmailAndPassword...')
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            console.log('🔐 [LOGIN] Firebase Auth exitoso, UID:', userCredential.user.uid)

            console.log('🔐 [LOGIN] Buscando documento en Firestore...')
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
            console.log('🔐 [LOGIN] Documento existe:', userDoc.exists())

            if (userDoc.exists()) {
                const userData = userDoc.data()

                // --- AUTO-REPAIR MISSING FIELDS ---
                if (!userData.tenantId || !userData.role) {
                    console.log('🔧 [LOGIN] Reparando documento de usuario (campos faltantes)...')
                    await updateDoc(doc(db, 'users', userCredential.user.uid), {
                        tenantId: userData.tenantId || 'default',
                        role: userData.role || 'vendedor'
                    })
                }

                setState({
                    user: {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email || '',
                        nombre: userData.nombre || userCredential.user.displayName || 'Usuario',
                        role: userData.role || 'vendedor',
                        tenantId: userData.tenantId || 'default', // Multi-tenant
                        empresaNombre: userData.empresaNombre || undefined,
                        createdAt: userData.createdAt?.toDate() || new Date(),
                        photoURL: userCredential.user.photoURL || undefined,
                        permisos: userData.permisos || undefined
                    },
                    loading: false,
                    error: null
                })
            } else {
                // Usuario existe en Auth pero no tiene documento en Firestore
                // Verificar si hay usuarios existentes (si no hay, este será admin)
                console.log('🔐 [LOGIN] Documento no existe, creando documento de usuario...')

                let isFirstUser = true // Default to admin if we can't check

                try {
                    const usersRef = collection(db, 'users')
                    const usersSnapshot = await getDocs(usersRef)
                    isFirstUser = usersSnapshot.empty
                    console.log('🔐 [LOGIN] Verificación de usuarios exitosa. Es primer usuario?', isFirstUser)
                } catch (checkError) {
                    // If we can't list users (permission denied or other error), assume first user for bootstrap
                    console.warn('🔐 [LOGIN] No se pudo verificar usuarios. Asumiendo primer usuario para permitir acceso.', checkError)
                    isFirstUser = true
                }

                // Crear documento para el usuario
                const newUser: User = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email || '',
                    nombre: userCredential.user.displayName || 'Administrador',
                    role: isFirstUser ? 'admin' : 'vendedor',
                    empresaNombre: 'Mi Empresa', // Default for first user
                    tenantId: userCredential.user.uid, // SEED TENANT ID WITH UID
                    createdAt: new Date()
                }
                console.log('🔐 [LOGIN] Creando usuario con rol:', newUser.role, 'y tenantId:', newUser.tenantId)
                console.warn('🔐 [LOGIN] ATTEMPTING FS WRITE (setDoc)...')
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser)
                console.warn('🔐 [LOGIN] FS WRITE SUCCEEDED!')

                setState({
                    user: newUser,
                    loading: false,
                    error: null
                })
            }
        } catch (error: any) {
            console.error("Login Error:", error)
            let msg = 'Error al iniciar sesión'
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                msg = 'Correo o contraseña incorrectos'
            } else if (error.code === 'auth/too-many-requests') {
                msg = 'Demasiados intentos fallidos. Intente más tarde.'
            }
            setState(prev => ({ ...prev, loading: false, error: msg }))
            throw new Error(msg)
        }
    }

    const register = async (email: string, password: string, nombre: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }))
        try {
            // Using static import from top of file
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)

            // Create user profile in Firestore
            const newUser: User = {
                uid: userCredential.user.uid,
                email: email,
                nombre: 'Administrador', // User name default for admin
                empresaNombre: nombre, // The "Nombre de la Empresa" from the form
                role: 'admin',
                tenantId: userCredential.user.uid,
                createdAt: new Date()
            }

            await setDoc(doc(db, 'users', userCredential.user.uid), newUser)

            // State update handled by onAuthStateChanged
        } catch (error: any) {
            console.error("Register Error FULL OBJECT:", error)
            let msg = 'Error al registrarse'
            if (error.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado'
            if (error.code === 'auth/weak-password') msg = 'La contraseña es muy débil (min 6 caracteres)'
            if (error.code === 'auth/operation-not-allowed') msg = 'Habilita "Email/Password" en Firebase Console'
            if (error.code === 'auth/network-request-failed') msg = 'Error de conexión. Verifica tu internet.'

            setState(prev => ({ ...prev, loading: false, error: msg }))
            throw new Error(msg)
        }
    }

    const logout = async () => {
        try {
            await firebaseSignOut(auth)
            // State update handled by onAuthStateChanged
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    const hasRole = (role: UserRole): boolean => {
        if (!state.user) return false
        if (state.user.role === 'admin') return true
        return state.user.role === role
    }

    const hasPermiso = (permiso: Permiso): boolean => {
        if (!state.user) return false
        // Admin tiene todos los permisos
        if (state.user.role === 'admin') return true

        // 1. Verificar si tiene permisos personalizados (Exclusivo)
        if (state.user.permisos && Array.isArray(state.user.permisos)) {
            return state.user.permisos.includes(permiso)
        }

        // 2. Si no tiene personalizados, usar defecto del rol
        const permisosRol = PERMISOS_POR_ROL[state.user.role] || []
        return permisosRol.includes(permiso)
    }

    const resetPassword = async (email: string): Promise<void> => {
        try {
            await sendPasswordResetEmail(auth, email)
        } catch (error: any) {
            console.error('Error sending password reset:', error)
            let msg = 'Error al enviar correo de recuperación'
            if (error.code === 'auth/user-not-found') {
                msg = 'No existe una cuenta con este correo'
            } else if (error.code === 'auth/invalid-email') {
                msg = 'Correo electrónico inválido'
            }
            throw new Error(msg)
        }
    }

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasRole, hasPermiso, register, resetPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
