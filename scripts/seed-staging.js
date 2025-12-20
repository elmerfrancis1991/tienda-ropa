const admin = require('firebase-admin');
const serviceAccount = require('../service-account-staging.json');

// Instructions:
// Key automatically copied from Downloads.
// Run: node scripts/seed-staging.js

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  console.log('Seeding Staging...');
  
  // Seed Products
  const products = [
    { nombre: 'Camisa Test', precio: 1000, costo: 500, stock: 100, categoria: 'Ropa' },
    { nombre: 'Pantalón Test', precio: 2000, costo: 1200, stock: 50, categoria: 'Ropa' }
  ];

  for (const p of products) {
    await db.collection('productos').add({
      ...p,
      createdAt: new Date(),
      active: true
    });
  }

  console.log('Seeding Complete');
}

seed();
*/
console.log('Please configure service account to run seed script.');
