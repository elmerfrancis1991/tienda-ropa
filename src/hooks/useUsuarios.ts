import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    onSnapshot,
    orderBy,
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
                // Usar colección 'users' para sincronizar con Auth
                const q = query(
                    collection(db, 'users'),
                    where('tenantId', '==', user.tenantId)
                )

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const users = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            uid: doc.id,
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        }
                    }) as User[]

                    // Sort in memory
                    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

                    setUsuarios(users)
                    setLoading(false)
                    setError(null)
                }, (err) => {
                    console.error("Firestore users error:", err)
                    setError("Error al cargar usuarios")
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

    // Crear usuario con Firebase Auth + Firestore
    const createUser = useCallback(async (userData: {
        nombre: string
        email: string
        password: string
        role: UserRole
        permisos?: Permiso[]
    }) => {
        try {
            // 1. Crear cuenta en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            )

            // 2. Crear documento en Firestore con el mismo UID
            const newUser: User = {
                uid: userCredential.user.uid,
                email: userData.email,
                nombre: userData.nombre,
                role: userData.role,
                createdAt: new Date(),
                permisos: userData.permisos,
                tenantId: 'default'
            }

            await setDoc(doc(db, 'users', userCredential.user.uid), newUser)

            console.log('Usuario creado exitosamente:', newUser.email)
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
    }, [])

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
            // Solo eliminar documento de Firestore
            // Nota: Eliminar de Firebase Auth requiere Admin SDK o que el usuario esté logueado
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
