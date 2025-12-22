import React, { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function ProductList({ tenantId, role }){
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')

  useEffect(()=>{
    if(!tenantId) return
    const q = query(collection(db, 'products'), where('tenantId','==',tenantId))
    const unsub = onSnapshot(q, snap=>{
      const arr = []
      snap.forEach(doc=>arr.push({ id: doc.id, ...doc.data() }))
      setProducts(arr)
    })
    return ()=>unsub()
  },[tenantId])

  const add = async ()=>{
    if(!name) return
    if(!(role === 'owner' || role === 'admin')) return alert('No tienes permiso para crear productos')
    await addDoc(collection(db,'products'), { name, tenantId, createdAt: serverTimestamp() })
    setName('')
  }

  return (
    <div>
      <h3>Productos</h3>
      <div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre producto" />
        <button onClick={add}>Agregar</button>
      </div>
      <ul>
        {products.map(p=> <li key={p.id}>{p.name}</li>)}
      </ul>
    </div>
  )
}
