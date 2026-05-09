'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MenuItem } from '@/types'

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', prepTime: '' })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)))
    })
    return unsub
  }, [])

  const addItem = async () => {
    if (!form.name || !form.price) return
    await addDoc(collection(db, 'menu'), {
      name: form.name,
      description: form.description,
      price: parseInt(form.price),
      category: form.category || 'Asosiy',
      prepTime: parseInt(form.prepTime) || 10,
      available: true,
    })
    setForm({ name: '', description: '', price: '', category: '', prepTime: '' })
    setShowForm(false)
  }

  const toggleAvailable = async (id: string, available: boolean) => {
    await updateDoc(doc(db, 'menu', id), { available: !available })
  }

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id))
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 pt-2">
        <h1 className="text-2xl font-bold" style={{color: '#D4AF37'}}>🍽️ Menyu</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl font-bold text-black"
          style={{background: '#D4AF37'}}>
          + Qo'shish
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-2xl mb-4" style={{background: '#1E1E24'}}>
          <h3 className="text-white font-bold mb-3">Yangi mahsulot</h3>
          {[
            { key: 'name', placeholder: 'Nomi *' },
            { key: 'description', placeholder: 'Tavsif' },
            { key: 'price', placeholder: 'Narxi (so\'m) *' },
            { key: 'category', placeholder: 'Kategoriya' },
            { key: 'prepTime', placeholder: 'Tayyorlanish vaqti (daqiqa)' },
          ].map(f => (
            <input key={f.key}
              placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="w-full p-3 rounded-xl mb-2 text-white outline-none"
              style={{background: '#0B0B0F', border: '1px solid #333'}}
            />
          ))}
          <div className="flex gap-2">
            <button onClick={addItem}
              className="flex-1 py-3 rounded-xl font-bold text-black"
              style={{background: '#D4AF37'}}>Saqlash</button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl text-white"
              style={{background: '#333'}}>Bekor</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="p-4 rounded-2xl" style={{background: '#1E1E24'}}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-white font-bold">{item.name}</p>
                <p className="text-gray-400 text-sm">{item.description}</p>
                <p className="font-bold mt-1" style={{color: '#D4AF37'}}>{item.price?.toLocaleString()} so'm</p>
                <p className="text-gray-500 text-xs">{item.category} • {item.prepTime} daq</p>
              </div>
              <div className="flex flex-col gap-2 ml-3">
                <button onClick={() => toggleAvailable(item.id, item.available)}
                  className="px-3 py-1 rounded-lg text-xs"
                  style={{background: item.available ? '#00C89633' : '#ff444433', 
                    color: item.available ? '#00C896' : '#ff4444'}}>
                  {item.available ? '✅ Mavjud' : '❌ Yoq'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="px-3 py-1 rounded-lg text-xs"
                  style={{background: '#ff444433', color: '#ff4444'}}>
                  🗑️ O'chir
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 text-center py-12">Menyu bo'sh</p>
        )}
      </div>
    </div>
  )
}
