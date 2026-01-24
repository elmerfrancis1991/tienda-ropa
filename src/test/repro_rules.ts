
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'; // Using anonymous to emulate 'fresh user' if enabled, or just checking public read
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// PROD CONFIG (Hardcoded from src/lib/firebase.ts)
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

async function testRules() {
    console.log('🧪 Starting Internal Rules Test on PRODUCTION config...');

    try {
        // 1. Try to Auth (Anonymous is easiest for automated test, but might be disabled)
        // If disabled, we can't fully test without a real credential.
        // Let's assume we need a credential.
        // Since I don't have one, I will try Anonymous first.
        console.log('🔑 Attempting Anonymous Auth...');
        let user;
        try {
            const cred = await signInAnonymously(auth);
            user = cred.user;
            console.log('✅ Auth Success:', user.uid);
        } catch (e: any) {
            console.warn('⚠️ Anonymous Auth failed (likely disabled).', e.code);
            // Fallback: We can't proceed without a user for the "create user" test.
            // But we can check if we can read a public document? No public docs.
            console.log('❌ Cannot proceed with Write Test without Auth.');
            return;
        }

        // 2. Try to Create User Document (The failing step)
        // match /users/{userId} allow create: if isAuth() && request.auth.uid == userId;
        console.log('📝 Attempting to create user document...');
        const userRef = doc(db, 'users', user.uid);

        const testData = {
            uid: user.uid,
            role: 'vendedor', // Trying as non-admin
            tenantId: 'test-tenant-' + Date.now(),
            createdAt: new Date()
        };

        await setDoc(userRef, testData);
        console.log('✅ Write Success! Rule is working.');

        // Cleanup?
        // await deleteDoc(userRef); 

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.code, error.message);
        if (error.code === 'permission-denied') {
            console.error('🛡️ PERMISSION DENIED - The rule is still blocking the write.');
        }
    } finally {
        // Exit
        process.exit(0);
    }
}

testRules();
