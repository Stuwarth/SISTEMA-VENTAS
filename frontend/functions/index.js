const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

exports.createUser = functions.https.onCall(async (data, context) => {
  if(!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'La llamada requiere autenticación')
  }
  const callerUid = context.auth.uid
  const callerSnap = await db.doc(`users/${callerUid}`).get()
  if(!callerSnap.exists) {
    throw new functions.https.HttpsError('permission-denied','Perfil no encontrado')
  }
  const caller = callerSnap.data()
  if(!caller || !['owner','admin'].includes(caller.role)){
    throw new functions.https.HttpsError('permission-denied','No autorizado')
  }

  const { email, password, role } = data
  if(!email || !password) {
    throw new functions.https.HttpsError('invalid-argument','Email y contraseña requeridos')
  }

  try{
    const userRecord = await admin.auth().createUser({ email, password })
    await db.doc(`users/${userRecord.uid}`).set({
      email,
      role: role || 'vendedor',
      tenantId: caller.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return { uid: userRecord.uid }
  }catch(err){
    console.error('createUser error', err)
    throw new functions.https.HttpsError('internal','Error creando usuario: ' + (err.message||err))
  }
})
