'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order } from '@/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    })
    return unsub
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'orders', id), { status })
  }

  const statusColor: Record<string, string> = {
    new: '#D4AF37',
    preparing: '#3B82F6',
    ready: '#00C896',
    paid: '#666',
  }

  const statusLabel: Record<string, string> = {
    new: 'Yangi',
    preparing: 'Jarayonda',
    ready: 'Tayyor',
    paid: 'To\'langan',
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 pt-2" style={{color: '#D4AF37'}}>📋 Buyurtmalar</h1>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'new', 'preparing', 'ready', 'paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1 rounded-full text-sm whitespace-nowrap"
            style={{
              background: filter === s ? '#D4AF37' : '#1E1E24',
              color: filter === s ? '#000' : '#fff'
            }}>
            {s === 'all' ? 'Hammasi' : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="p-4 rounded-2xl" style={{background: '#1E1E24'}}>
            <div className="flex justify-between mb-2">
              <span className="text-white font-bold">Stol #{order.tableId}</span>
              <span className="text-xs px-2 py-1 rounded-full"
                style={{background: statusColor[order.status] + '33', color: statusColor[order.status]}}>
                {statusLabel[order.status]}
              </span>
            </div>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-400 text-sm mb-1">
                <span>{item.menuItem?.name} x{item.quantity}</span>
                <span>{(item.menuItem?.price * item.quantity)?.toLocaleString()} so'm</span>
              </div>
            ))}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
              <span className="text-white font-bold">{order.total?.toLocaleString()} so'm</span>
              {order.status !== 'paid' && (
                <select onChange={e => updateStatus(order.id, e.target.value)}
                  value={order.status}
                  className="text-sm px-2 py-1 rounded-lg"
                  style={{background: 'transparent', color: '#fff', border: '1px solid #333'}}>
                  <option value="new">Yangi</option>
                  <option value="preparing">Jarayonda</option>
                  <option value="ready">Tayyor</option>
                  <option value="paid">To'langan</option>
                </select>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-12">Buyurtma yo'q</p>
        )}
      </div>
    </div>
  )
}
