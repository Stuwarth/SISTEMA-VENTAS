// Check for seeded auth user via admin SDK (connects to emulator if FIREBASE_AUTH_EMULATOR_HOST set)
const admin = require('firebase-admin');
(async ()=>{
  try{
    if(!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = 'sistema-ventas-mvp';
    admin.initializeApp({projectId: process.env.GOOGLE_CLOUD_PROJECT});
    const email = 'owner@example.com';
    const u = await admin.auth().getUserByEmail(email).catch(e=>{throw e});
    console.log('FOUND USER:', u.uid, u.email);
  }catch(err){
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
