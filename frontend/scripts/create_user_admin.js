#!/usr/bin/env node
/*
  Usage (PowerShell):
    node .\scripts\create_user_admin.js --key=path\to\serviceAccount.json --email=empleado@ejemplo.com --password=Secreto123 --role=admin --tenantId=TENANT_ID

  Or set env var: $env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\key.json'
    node .\scripts\create_user_admin.js --email=... --password=... --role=... --tenantId=...

  This script uses the Firebase Admin SDK to create an Auth user and a Firestore `users/{uid}` document.
*/

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

function parseArgs() {
  const out = {}
  process.argv.slice(2).forEach(a=>{
    if(a.startsWith('--')){
      const eq = a.indexOf('=')
      if(eq>-1){
        const k = a.slice(2,eq)
        const v = a.slice(eq+1)
        out[k]=v
      }
    }
  })
  return out
}

async function main(){
  const args = parseArgs()
  const keyPath = args.key || process.env.GOOGLE_APPLICATION_CREDENTIALS
  if(!keyPath){
    console.error('Falta la clave de servicio. Pasa --key=path o define GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
  const abs = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)
  if(!fs.existsSync(abs)){
    console.error('No existe el archivo de clave en', abs)
    process.exit(1)
  }
  const serviceAccount = require(abs)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const email = args.email
  const password = args.password
  const role = args.role || 'vendedor'
  const tenantId = args.tenantId
  if(!email || !password || !tenantId){
    console.error('Faltan parámetros. Se requieren --email, --password y --tenantId')
    process.exit(1)
  }

  try{
    // Try to create user in Auth
    let userRecord
    try{
      userRecord = await admin.auth().createUser({ email, password })
      console.log('Usuario Auth creado:', userRecord.uid)
    }catch(err){
      if(err.code === 'auth/email-already-exists'){
        console.log('El email ya existe en Auth. Buscando UID...')
        const existing = await admin.auth().getUserByEmail(email)
        userRecord = existing
        console.log('UID existente:', userRecord.uid)
      }else{
        throw err
      }
    }

    const db = admin.firestore()
    await db.doc(`users/${userRecord.uid}`).set({
      email,
      role,
      tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    console.log('Documento users/{uid} creado/actualizado para', userRecord.uid)
    process.exit(0)
  }catch(err){
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
