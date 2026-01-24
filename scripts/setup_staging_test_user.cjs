
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-staging.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function setupUser() {
    const testEmail = `test-rules-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    console.log(`Creating test user: ${testEmail}`);

    try {
        const user = await admin.auth().createUser({
            email: testEmail,
            password: testPassword,
            displayName: 'Test User'
        });

        console.log('User created:', user.uid);
        console.log(`__CREDENTIALS__:${testEmail}:${testPassword}`); // Output for next script to grab

        // Ensure NO firestore doc exists
        await admin.firestore().collection('users').doc(user.uid).delete();
        console.log('Ensured no Firestore doc exists.');

    } catch (e) {
        console.error('Error creating user:', e);
        process.exit(1);
    }
}

setupUser();
