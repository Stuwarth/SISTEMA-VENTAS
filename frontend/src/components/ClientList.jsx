import React, { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function ClientList({ tenantId }){
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(()=>{
    if(!tenantId) return
    const q = query(collection(db, 'clients'), where('tenantId','==',tenantId))
    const unsub = onSnapshot(q, snap=>{
      const arr = []
      snap.forEach(d=>arr.push({ id: d.id, ...d.data() }))
      setClients(arr)
    })
    return ()=>unsub()
  },[tenantId])

  const resetForm = ()=>{
    setName('')
    setPhone('')
    setEditing(null)
  }

  const add = async ()=>{
    if(!name) return alert('Nombre requerido')
    if(editing){
      const ref = doc(db,'clients',editing)
      await updateDoc(ref, { name, phone, updatedAt: serverTimestamp() })
      resetForm()
      return
    }
    await addDoc(collection(db,'clients'), { name, phone, tenantId, createdAt: serverTimestamp() })
    resetForm()
  }

  const remove = async (id)=>{
    if(!confirm('Eliminar cliente?')) return
    await deleteDoc(doc(db,'clients',id))
  }

  const startEdit = (c)=>{
    setEditing(c.id)
    setName(c.name)
    setPhone(c.phone||'')
  }

  return (
    <div>
      <h3>Clientes</h3>
      <div>
        <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button onClick={add}>{editing? 'Guardar' : 'Agregar'}</button>
        {editing && <button onClick={resetForm}>Cancelar</button>}
      </div>
      <ul>
        {clients.map(c=> (
          <li key={c.id}>
            <strong>{c.name}</strong> {c.phone && <span>- {c.phone}</span>}
            <button onClick={()=>startEdit(c)} style={{marginLeft:8}}>Editar</button>
            <button onClick={()=>remove(c.id)} style={{marginLeft:8}}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
