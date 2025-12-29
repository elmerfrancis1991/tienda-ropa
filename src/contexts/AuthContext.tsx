import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                try {
                    // Try to get custom role/data from Firestore 'users' collection
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        setState({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                nombre: userData.nombre || firebaseUser.displayName || 'Usuario',
                                role: userData.role || 'vendedor',
                                createdAt: userData.createdAt?.toDate() || new Date(),
                                photoURL: firebaseUser.photoURL || undefined
                            },
                            loading: false,
                            error: null
                        })
                    } else {
                        // If no firestore doc, plain User data (fallback) -> Probably a first registration
                        const newUser: User = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            nombre: firebaseUser.displayName || 'Usuario Nuevo',
                            role: 'admin', // First users might default to admin for simplicity in this sprint, or wait for setup
                            createdAt: new Date()
                        }
                        setState({ user: newUser, loading: false, error: null })
                    }
                } catch (e) {
                    console.error("Error fetching user profile:", e)
                    // Still log them in but with basic info
                    setState({
                        user: {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            nombre: 'Usuario',
                            role: 'vendedor',
                            createdAt: new Date()
                        },
                        loading: false,
                        error: null
                    })
                }
            } else {
                // User is signed out
                setState({ user: null, loading: false, error: null })
            }
        })

        // Backup timeout in case Firebase is blocked or offline and doesn't fire immediately
        const safetyTimer = setTimeout(() => {
            setState(current => {
                if (current.loading) {
                    console.warn("Firebase Auth timed out. Forcing loading=false")
                    return { ...current, loading: false, error: 'La conexión con el servidor de autenticación está tardando. Verifique su internet.' }
                }
                return current
            })
        }, 15000)

        return () => {
            unsubscribe()
            clearTimeout(safetyTimer)
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
                setState({
                    user: {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email || '',
                        nombre: userData.nombre || userCredential.user.displayName || 'Usuario',
                        role: userData.role || 'vendedor',
                        createdAt: userData.createdAt?.toDate() || new Date(),
                        photoURL: userCredential.user.photoURL || undefined
                    },
                    loading: false,
                    error: null
                })
            } else {
                // Usuario existe en Auth pero no tiene documento en Firestore
                // Verificar si hay usuarios existentes (si no hay, este será admin)
                console.log('🔐 [LOGIN] Documento no existe, verificando si hay usuarios...')

                const usersRef = collection(db, 'users')
                const usersSnapshot = await getDocs(usersRef)
                const isFirstUser = usersSnapshot.empty

                console.log('🔐 [LOGIN] Es primer usuario?', isFirstUser)

                // Crear documento para el usuario
                const newUser = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email || '',
                    nombre: userCredential.user.displayName || 'Administrador',
                    role: isFirstUser ? 'admin' as const : 'vendedor' as const,
                    createdAt: new Date()
                }
                console.log('🔐 [LOGIN] Creando usuario con rol:', newUser.role)
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser)
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
                nombre: nombre,
                role: 'vendedor', // Default to vendedor for security
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
        // Verificar permisos según rol
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
