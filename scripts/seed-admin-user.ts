// Script para crear el usuario admin en Firestore
// Ejecutar con: npx ts-node scripts/seed-admin-user.ts

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore'

// Firebase config para Staging (correcto)
const firebaseConfig = {
    apiKey: "AIzaSyB3M9cxNTjPvd2iRykjK5jw-KXTV3JEWtY",
    authDomain: "tienda-ropa-staging-demo.firebaseapp.com",
    projectId: "tienda-ropa-staging-demo",
    storageBucket: "tienda-ropa-staging-demo.firebasestorage.app",
    messagingSenderId: "326123845684",
    appId: "1:326123845684:web:fe1bea0f0317b243a17261"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function seedAdminUser() {
    const adminUID = 'TuGya2OIFjeQrQZEuS1Fuw3pp0t1'

    try {
        await setDoc(doc(db, 'users', adminUID), {
            nombre: 'Administrador',
            email: 'admin@tienda.com',
            role: 'admin',
            createdAt: Timestamp.now()
        })
        console.log('✅ Usuario admin creado exitosamente!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Error creando usuario:', error)
        process.exit(1)
    }
}

seedAdminUser()
