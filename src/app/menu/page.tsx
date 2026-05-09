'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MenuItem } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function MenuContent() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Hammasi')
  const { addItem, items } = useCartStore()
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')
  const { setTableId } = useCartStore()

  useEffect(() => {
    if (tableId) setTableId(tableId)
    const unsub = onSnapshot(collection(db, 'menu'), snap => {
      setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)))
    })
    return unsub
  }, [tableId])

  const categories = ['Hammasi', ...Array.from(new Set(menu.map(m => m.category)))]
  const filtered = menu.filter(m => m.available)
    .filter(m => category === 'Hammasi' || m.category === category)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)

  return (
    <div className="min-h-screen pb-24" style={{background: '#0B0B0F'}}>
      <div className="sticky top-0 p-4 z-10" style={{background: '#0B0B0F'}}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{color: '#D4AF37'}}>🍽️ Menyu</h1>
            {tableId && <p className="text-gray-400 text-xs">Stol #{tableId}</p>}
          </div>
          {cartCount > 0 && (
            <Link href="/cart">
              <button className="px-4 py-2 rounded-xl font-bold text-black text-sm"
                style={{background: '#D4AF37'}}>
                🛒 {cartCount} • {cartTotal.toLocaleString()} so'm
              </button>
            </Link>
          )}
        </div>
        <input placeholder="🔍 Qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-3 rounded-2xl text-white outline-none mb-3"
          style={{background: '#1E1E24'}}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="px-3 py-1 rounded-full text-sm whitespace-nowrap"
              style={{background: category === cat ? '#D4AF37' : '#1E1E24',
                color: category === cat ? '#000' : '#fff'}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.map(item => {
          const qty = items.find(i => i.menuItem.id === item.id)?.quantity || 0
          return (
            <div key={item.id} className="p-4 rounded-2xl flex justify-between items-center"
              style={{background: '#1E1E24'}}>
              <div className="flex-1 mr-3">
                <h3 className="text-white font-bold">{item.name}</h3>
                {item.description && <p className="text-gray-400 text-sm mt-1">{item.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <p className="font-bold" style={{color: '#D4AF37'}}>{item.price?.toLocaleString()} so'm</p>
                  {item.prepTime && <p className="text-gray-500 text-xs">⏱ {item.prepTime} daq</p>}
                </div>
              </div>
              {qty === 0 ? (
                <button onClick={() => addItem(item)}
                  className="w-10 h-10 rounded-full font-bold text-black text-xl flex items-center justify-center"
                  style={{background: '#D4AF37'}}>+</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => useCartStore.getState().updateQuantity(item.id, qty - 1)}
                    className="w-8 h-8 rounded-full font-bold text-black"
                    style={{background: '#D4AF37'}}>-</button>
                  <span className="text-white w-5 text-center">{qty}</span>
                  <button onClick={() => addItem(item)}
                    className="w-8 h-8 rounded-full font-bold text-black"
                    style={{background: '#D4AF37'}}>+</button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-12">Mahsulot topilmadi</p>
        )}
      </div>
    </div>
  )
}

export default function MenuPage() {
  return <Suspense><MenuContent /></Suspense>
}
