import React, { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function SaleList({ tenantId, role }){
  const [sales, setSales] = useState([])
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(()=>{
    if(!tenantId) return
    const q = query(collection(db, 'sales'), where('tenantId','==',tenantId))
    const unsub = onSnapshot(q, snap=>{
      const arr = []
      snap.forEach(doc=>arr.push({ id: doc.id, ...doc.data() }))
      setSales(arr)
    })
    return ()=>unsub()
  },[tenantId])

  const add = async ()=>{
    if(!desc || !amount) return
    if(!(role === 'owner' || role === 'admin' || role === 'vendedor')) return alert('No tienes permiso para registrar ventas')
    await addDoc(collection(db,'sales'), { desc, amount: Number(amount), tenantId, createdAt: serverTimestamp() })
    setDesc('')
    setAmount('')
  }

  return (
    <div>
      <h3>Ventas</h3>
      <div>
        <input placeholder="Descripcion" value={desc} onChange={e=>setDesc(e.target.value)} />
        <input placeholder="Monto" value={amount} onChange={e=>setAmount(e.target.value)} />
        <button onClick={add}>Registrar</button>
      </div>
      <ul>
        {sales.map(s=> <li key={s.id}>{s.desc} - {s.amount}</li>)}
      </ul>
    </div>
  )
}
