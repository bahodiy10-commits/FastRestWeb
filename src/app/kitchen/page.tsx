'use client'
import { useEffect, useState, useRef } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order } from '@/types'

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const prevCount = useRef(0)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      const newOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => o.status === 'new' || o.status === 'preparing')
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      
      if (newOrders.length > prevCount.current) {
        try { new Audio('/notification.mp3').play() } catch(e) {}
      }
      prevCount.current = newOrders.length
      setOrders(newOrders)
    })
    return unsub
  }, [])

  const markReady = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { status: 'ready' })
  }

  const markPreparing = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { status: 'preparing' })
  }

  return (
    <div className="min-h-screen p-4" style={{background: '#0B0B0F'}}>
      <div className="flex justify-between items-center mb-6 pt-2">
        <h1 className="text-2xl font-bold" style={{color: '#D4AF37'}}>👨‍🍳 Oshxona</h1>
        <span className="px-3 py-1 rounded-full text-sm font-bold"
          style={{background: orders.length > 0 ? '#D4AF3733' : '#1E1E24', color: '#D4AF37'}}>
          {orders.length} buyurtma
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">✅</p>
          <p className="text-gray-400 text-lg">Barcha buyurtmalar bajarildi!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-2xl"
              style={{background: '#1E1E24', border: `2px solid ${order.status === 'new' ? '#D4AF37' : '#3B82F6'}44`}}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold text-xl">🪑 Stol #{order.tableId}</span>
                <span className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{background: order.status === 'new' ? '#D4AF3733' : '#3B82F633',
                    color: order.status === 'new' ? '#D4AF37' : '#3B82F6'}}>
                  {order.status === 'new' ? '🆕 Yangi' : '⏳ Jarayonda'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-xl"
                    style={{background: '#0B0B0F'}}>
                    <span className="text-white font-medium">{item.menuItem?.name}</span>
                    <span className="text-2xl font-bold" style={{color: '#D4AF37'}}>x{item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.items?.some(i => i.comment) && (
                <div className="p-2 rounded-xl mb-3" style={{background: '#D4AF3722'}}>
                  <p className="text-xs" style={{color: '#D4AF37'}}>
                    📝 {order.items.filter(i => i.comment).map(i => i.comment).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === 'new' && (
                  <button onClick={() => markPreparing(order.id)}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{background: '#3B82F633', color: '#3B82F6'}}>
                    ⏳ Boshlash
                  </button>
                )}
                <button onClick={() => markReady(order.id)}
                  className="flex-1 py-3 rounded-xl font-bold text-black"
                  style={{background: '#00C896'}}>
                  ✅ Tayyor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
