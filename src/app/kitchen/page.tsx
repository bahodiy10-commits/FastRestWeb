'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Order } from '@/types'

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
      setOrders(data.filter(o => o.status === 'new' || o.status === 'preparing'))
    })
    return unsub
  }, [])

  const handleReady = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { status: 'ready' })
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0B0B0F' }}>
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
            👨‍🍳 Oshxona
          </h1>
          <p className="text-gray-400 text-sm">{orders.length} buyurtma</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(255,77,109,0.15)', color: '#FF4D6D' }}
        >
          Chiqish
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="text-7xl mb-4">✅</div>
          <p className="text-white text-lg font-bold">Barcha buyurtmalar bajarildi!</p>
          <p className="text-gray-500 text-sm mt-2">Yangi buyurtma kelishini kuting</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-2xl"
              style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-lg" style={{ color: '#D4AF37' }}>
                  Stol #{order.tableId}
                </p>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: order.status === 'new' ? 'rgba(212,175,55,0.15)' : 'rgba(59,130,246,0.15)',
                    color: order.status === 'new' ? '#D4AF37' : '#3B82F6'
                  }}>
                  {order.status === 'new' ? '🆕 Yangi' : '🔄 Tayyorlanmoqda'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white">{item.menuItem?.name}</span>
                    <span className="text-gray-400">× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <p className="font-bold" style={{ color: '#00C896' }}>
                  {order.total?.toLocaleString()} so'm
                </p>
                <button
                  onClick={() => handleReady(order.id)}
                  className="px-5 py-2 rounded-xl font-bold text-black"
                  style={{ background: '#00C896' }}
                >
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
