'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Order } from '@/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
    })
    return unsub
  }, [])

  const stats = {
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    paid: orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total || 0), 0),
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{color: '#D4AF37'}}>FastRest</h1>
          <p className="text-gray-400 text-sm">Admin Panel</p>
        </div>
        <button onClick={handleLogout} 
          className="px-4 py-2 rounded-xl text-sm"
          style={{background: '#1E1E24', color: '#ff4444'}}>
          Chiqish
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: '🆕 Yangi', value: stats.new, color: '#D4AF37' },
          { label: '⏳ Jarayonda', value: stats.preparing, color: '#3B82F6' },
          { label: '✅ Tayyor', value: stats.ready, color: '#00C896' },
          { label: '💰 Tushum', value: stats.paid.toLocaleString() + " so'm", color: '#D4AF37' },
        ].map(card => (
          <div key={card.label} className="p-4 rounded-2xl" 
            style={{background: '#1E1E24', border: `1px solid ${card.color}44`}}>
            <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
            <p className="text-gray-400 text-xs mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-3">Faol buyurtmalar</h2>
      <div className="space-y-3">
        {orders.filter(o => o.status !== 'paid').length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-500">Hozircha buyurtma yo'q</p>
          </div>
        ) : (
          orders.filter(o => o.status !== 'paid').map(order => (
            <div key={order.id} className="p-4 rounded-2xl" style={{background: '#1E1E24'}}>
              <div className="flex justify-between">
                <span className="text-white font-bold">Stol #{order.tableId}</span>
                <span className="text-xs px-2 py-1 rounded-full" 
                  style={{background: '#D4AF3733', color: '#D4AF37'}}>
                  {order.status === 'new' ? 'Yangi' : order.status === 'preparing' ? 'Jarayonda' : 'Tayyor'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{order.total?.toLocaleString()} so'm</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
