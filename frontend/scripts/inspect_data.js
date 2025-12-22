const admin = require('firebase-admin')
const path = require('path')

function parseArgs(){
  const out = {}
  process.argv.slice(2).forEach(a=>{
    if(a.startsWith('--')){
      const eq = a.indexOf('=')
      if(eq>-1){
        out[a.slice(2,eq)] = a.slice(eq+1)
      }
    }
  })
  return out
}

async function inspect(keyPath){
  const abs = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)
  const serviceAccount = require(abs)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db = admin.firestore()

  const collections = ['tenants','users','products','clients','sales']
  for(const c of collections){
    try{
      const snap = await db.collection(c).get()
      console.log(`\nCollection: ${c} — count: ${snap.size}`)
      const byTenant = {}
      let i=0
      snap.forEach(doc=>{
        const data = doc.data()
        const t = data.tenantId || '<no-tenant>'
        byTenant[t] = (byTenant[t]||0)+1
        if(i<3){
          console.log('  sample:', doc.id, data)
        }
        i++
      })
      console.log('  counts by tenant:', byTenant)
    }catch(err){
      console.error('Error reading', c, err.message||err)
    }
  }
  process.exit(0)
}

async function main(){
  const args = parseArgs()
  const key = args.key || process.env.GOOGLE_APPLICATION_CREDENTIALS
  if(!key){
    console.error('Provide --key=path or set GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
  await inspect(key)
}

main()
