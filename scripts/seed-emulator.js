/* Seed script for Firebase Emulator Suite

Run after starting emulators (functions, firestore, auth).
Defaults target local emulator hosts; override via env vars:
  FIREBASE_AUTH_EMULATOR_HOST (e.g. 127.0.0.1:9099)
  FIRESTORE_EMULATOR_HOST (e.g. 127.0.0.1:8080)
*/

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT || 'sistema-ventas-mvp';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.GOOGLE_CLOUD_PROJECT = projectId;

admin.initializeApp({ projectId });

async function seed() {
  const uid = 'seed-owner-uid';
  const email = 'owner@example.com';
  try {
    await admin.auth().getUser(uid);
    console.log('Auth user already exists:', uid);
  } catch (err) {
    const user = await admin.auth().createUser({ uid, email, password: 'password' });
    console.log('Created auth user:', user.uid);
  }

  const db = admin.firestore();
  const tenantId = 'tenant-demo';

  await db.collection('users').doc(uid).set({
    role: 'owner',
    tenantId,
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Created users doc:', `users/${uid}`);

  await db.collection('tenants').doc(tenantId).set({
    name: 'Demo Tenant',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('Created tenant doc:', `tenants/${tenantId}`);

  console.log('\nSeeding complete.');
  console.log('Use this Auth UID for testing:', uid);
  console.log('Tenant ID:', tenantId);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
