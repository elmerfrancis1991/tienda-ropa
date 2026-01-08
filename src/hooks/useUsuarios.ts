import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    updateDoc,
    deleteDoc,
    doc,
    query,
    onSnapshot,
    setDoc,
    where
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { User, UserRole, Permiso } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    useEffect(() => {
        if (!user?.tenantId) return;

        let unsubscribe: () => void = () => { };

        const loadUsers = async () => {
            try {
                // Strictly filter by tenantId to comply with security rules and ensure isolation
                const q = query(
                    collection(db, 'users'),
                    where('tenantId', '==', user.tenantId)
                )

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const usersData = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            uid: doc.id,
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
                        }
                    }) as User[]

                    usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

                    setUsuarios(usersData)
                    setLoading(false)
                    setError(null)
                }, (err) => {
                    // Permission errors usually mean the user doc isn't fully ready or doesn't match the query
                    console.error("Firestore users error:", err)
                    if (err.code === 'permission-denied') {
                        // Keep quiet about transient permission issues during login/refresh
                        setUsuarios([])
                    } else {
                        setError("Error al sincronizar usuarios")
                    }
                    setLoading(false)
                })

            } catch (err) {
                console.error("Error setting up users listener:", err)
                setError("Error de conexión")
                setLoading(false)
            }
        }

        loadUsers()

        return () => {
            unsubscribe()
        }
    }, [user?.tenantId])

    const createUser = useCallback(async (userData: {
        nombre: string
        email: string
        password: string
        role: UserRole
        permisos?: Permiso[]
    }) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            )

            const newUser: User = {
                uid: userCredential.user.uid,
                email: userData.email,
                nombre: userData.nombre,
                empresaNombre: user?.empresaNombre || '', // Inherit company name
                role: userData.role,
                createdAt: new Date(),
                permisos: userData.permisos,
                tenantId: user?.tenantId || 'default'
            }

            await setDoc(doc(db, 'users', userCredential.user.uid), newUser)
            return userCredential.user.uid

        } catch (err: any) {
            console.error("Error creating user:", err)
            let message = 'Error al crear usuario'
            if (err.code === 'auth/email-already-in-use') {
                message = 'Este correo ya está registrado'
            } else if (err.code === 'auth/weak-password') {
                message = 'La contraseña debe tener al menos 6 caracteres'
            } else if (err.code === 'auth/invalid-email') {
                message = 'Correo electrónico inválido'
            }
            setError(message)
            throw new Error(message)
        }
    }, [user?.tenantId])

    const updateUser = useCallback(async (uid: string, data: Partial<User>) => {
        try {
            const userRef = doc(db, 'users', uid)
            await updateDoc(userRef, data)
        } catch (err) {
            console.error("Error updating user:", err)
            setError("Error al actualizar usuario")
            throw err
        }
    }, [])

    const deleteUser = useCallback(async (uid: string) => {
        try {
            await deleteDoc(doc(db, 'users', uid))
        } catch (err) {
            console.error("Error deleting user:", err)
            setError("Error al eliminar usuario")
            throw err
        }
    }, [])

    return {
        usuarios,
        loading,
        error,
        createUser,
        updateUser,
        deleteUser
    }
}
