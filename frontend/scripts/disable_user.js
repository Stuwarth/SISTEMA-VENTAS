#!/usr/bin/env node
/*
  Deshabilitar o habilitar acceso de un usuario (sin eliminarlo).
  Usage:
    node disable_user.js --key=path/to/key.json --uid=USER_UID --disable=true
    node disable_user.js --key=path/to/key.json --email=user@example.com --disable=false
*/

const admin = require('firebase-admin')
const path = require('path')

function parseArgs() {
  const out = {}
  process.argv.slice(2).forEach(a => {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=')
      if (eq > -1) out[a.slice(2, eq)] = a.slice(eq + 1)
    }
  })
  return out
}

async function main() {
  const args = parseArgs()
  const keyPath = args.key || process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyPath) {
    console.error('Falta --key=path o GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
  const abs = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)
  const sa = require(abs)
  admin.initializeApp({ credential: admin.credential.cert(sa) })

  let uid = args.uid
  if (!uid && args.email) {
    const user = await admin.auth().getUserByEmail(args.email)
    uid = user.uid
  }
  if (!uid) {
    console.error('Falta --uid o --email')
    process.exit(1)
  }

  const disable = args.disable !== 'false'
  await admin.auth().updateUser(uid, { disabled: disable })
  console.log(`Usuario ${uid} ${disable ? 'DESHABILITADO' : 'HABILITADO'}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
