
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// PROD CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyB3DPWf1feNhWJpJJKlIrTrIs75xN_dHvc",
    authDomain: "sistema-tienda-c646b.firebaseapp.com",
    projectId: "sistema-tienda-c646b",
    storageBucket: "sistema-tienda-c646b.firebasestorage.app",
    messagingSenderId: "714413861786",
    appId: "1:714413861786:web:5dde09114b6385208e2823"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runVerify() {
    const email = `test-prod-verify-${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`🧪 Verifying Rules in ***PRODUCTION*** (Sign Up Flow) for ${email}...`);

    try {
        console.log('🔑 Signing Up...');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        console.log('✅ Auth Success (Sign Up):', user.uid);

        console.log('📝 Attempting to create user document...');
        const userRef = doc(db, 'users', user.uid);

        const testData = {
            uid: user.uid, // MUST match auth.uid
            role: 'admin',
            tenantId: user.uid, // Simulating Register flow
            empresaNombre: 'Test Company',
            createdAt: new Date(),
            email: email,
            nombre: 'Test User'
        };

        await setDoc(userRef, testData);
        console.log('✅ Write Success! Rule is VALID in PRODUCTION.');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ WRITE FAILED:', error.code, error.message);
        if (error.code === 'permission-denied') {
            console.error('🛡️ CRITICAL: Permission Denied in PROD. Rules are NOT propagating or Logic is broken.');
        }
        process.exit(1);
    }
}

runVerify();
