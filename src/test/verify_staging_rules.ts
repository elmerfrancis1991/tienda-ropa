
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// STAGING CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyB3M9cxNTjPvd2iRykjK5jw-KXTV3JEWtY",
    authDomain: "tienda-ropa-staging-demo.firebaseapp.com",
    projectId: "tienda-ropa-staging-demo",
    storageBucket: "tienda-ropa-staging-demo.firebasestorage.app",
    messagingSenderId: "326123845684",
    appId: "1:326123845684:web:fe1bea0f0317b243a17261"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runVerify() {
    const email = `test-verify-${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`🧪 Verifying Rules in STAGING (Sign Up Flow) for ${email}...`);

    try {
        console.log('🔑 Signing Up...');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        console.log('✅ Auth Success (Sign Up):', user.uid);

        console.log('📝 Attempting to create user document...');
        const userRef = doc(db, 'users', user.uid);

        const testData = {
            uid: user.uid, // MUST match auth.uid
            role: 'vendedor',
            tenantId: 'test-tenant-verify',
            createdAt: new Date(),
            email: email,
            nombre: 'Test User'
        };

        await setDoc(userRef, testData);
        console.log('✅ Write Success! Rule is VALID.');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ WRITE FAILED:', error.code, error.message);
        if (error.code === 'permission-denied') {
            console.error('🛡️ CRITICAL: Permission Denied. The rule logic is broken.');
        }
        process.exit(1);
    }
}

runVerify();
