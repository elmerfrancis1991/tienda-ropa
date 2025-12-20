// Firebase Configuration
// Las credenciales se cargan desde variables de entorno (.env)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuraciones de respaldo (Fallbacks) para cuando no hay variables de entorno (Build en GitHub)
const CONFIG_PROD = {
    apiKey: "AIzaSyB3DPWf1feNhWJpJJKlIrTrIs75xN_dHvc",
    authDomain: "sistema-tienda-c646b.firebaseapp.com",
    projectId: "sistema-tienda-c646b",
    storageBucket: "sistema-tienda-c646b.firebasestorage.app",
    messagingSenderId: "714413861786",
    appId: "1:714413861786:web:5dde09114b6385208e2823"
};

const CONFIG_STAGING = {
    apiKey: "AIzaSyB3M9cxNTjPvd2iRykjK5jw-KXTV3JEWtY",
    authDomain: "tienda-ropa-staging-demo.firebaseapp.com",
    projectId: "tienda-ropa-staging-demo",
    storageBucket: "tienda-ropa-staging-demo.firebasestorage.app",
    messagingSenderId: "326123845684",
    appId: "1:326123845684:web:fe1bea0f0317b243a17261"
};

const getFirebaseConfig = () => {
    const env = import.meta.env;

    // Si tenemos variables de entorno, las usamos
    if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
        return {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: env.VITE_FIREBASE_APP_ID,
        };
    }

    // Si no hay variables de entorno (ej: Build en GitHub), usamos los respaldos según el modo
    const isStaging = env.VITE_APP_ENV === 'staging' || window.location.hostname.includes('staging');
    console.warn(`⚠️ Firebase: Usando configuración de respaldo (${isStaging ? 'STAGING' : 'PROD'})`);
    return isStaging ? CONFIG_STAGING : CONFIG_PROD;
};

const firebaseConfig = getFirebaseConfig();

// Validar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('⚠️ Firebase: Variables de entorno no configuradas. Copia .env.example a .env')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
