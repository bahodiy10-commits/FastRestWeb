'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Order } from '@/types'

interface TableInfo { room: string; number: number }

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tableMap, setTableMap] = useState<Record<string, TableInfo>>({})
  const router = useRouter()

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'orders'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
      setOrders(data.filter(o => o.status === 'new' || o.status === 'preparing'))
    })
    const unsub2 = onSnapshot(collection(db, 'tables'), snap => {
      const map: Record<string, TableInfo> = {}
      snap.docs.forEach(d => { const x = d.data(); map[d.id] = { room: x.room, number: x.number } })
      setTableMap(map)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const getTableLabel = (tableId: string) => {
    if (!tableId || tableId === 'takeaway') return 'Olib ketish'
    const t = tableMap[tableId]
    return t ? `${t.room} — Stol #${t.number}` : `Stol #${tableId.slice(0,6)}`
  }

  const handleReady = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { status: 'ready' })
  }

  const handleLogout = async () => { await signOut(auth); router.push('/') }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0B0B0F' }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes newOrder {
          0%{box-shadow:0 0 0 0 rgba(212,175,55,0.6)}
          70%{box-shadow:0 0 0 12px rgba(212,175,55,0)}
          100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}
        }
        .order-card{animation:slideUp 0.4s ease both;transition:transform 0.2s}
        .order-card:hover{transform:translateY(-2px)}
        .order-card:nth-child(1){animation-delay:0.05s}
        .order-card:nth-child(2){animation-delay:0.1s}
        .order-card:nth-child(3){animation-delay:0.15s}
        .order-new{animation:newOrder 2s infinite}
        .ready-btn{transition:transform 0.15s ease,box-shadow 0.2s ease}
        .ready-btn:hover{box-shadow:0 4px 16px rgba(0,200,150,0.4)}
        .ready-btn:active{transform:scale(0.95)}
        .badge{animation:fadeIn 0.3s ease}
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>👨‍🍳 Oshxona</h1>
          <p className="text-gray-400 text-sm">{orders.length} ta buyurtma</p>
        </div>
        <button onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>
          Chiqish
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32" style={{animation:'slideUp 0.5s ease'}}>
          <div className="text-7xl mb-4">✅</div>
          <p className="text-white text-lg font-bold">Barcha buyurtmalar bajarildi!</p>
          <p className="text-gray-500 text-sm mt-2">Yangi buyurtma kelishini kuting</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id}
              className={`order-card p-4 rounded-2xl ${order.status==='new'?'order-new':''}`}
              style={{background:'#1E1E24',border:`1px solid ${order.status==='new'?'rgba(212,175,55,0.4)':'#2A2A35'}`}}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-bold text-lg" style={{color:'#D4AF37'}}>
                    {getTableLabel(order.tableId)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('uz-UZ')}
                  </p>
                </div>
                <span className="badge text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background:order.status==='new'?'rgba(212,175,55,0.15)':'rgba(59,130,246,0.15)',
                    color:order.status==='new'?'#D4AF37':'#3B82F6',
                    border:`1px solid ${order.status==='new'?'rgba(212,175,55,0.3)':'rgba(59,130,246,0.3)'}`,
                  }}>
                  {order.status==='new'?'🆕 Yangi':'🔄 Jarayonda'}
                </span>
              </div>

              <div className="space-y-2 mb-4 p-3 rounded-xl" style={{background:'#0B0B0F'}}>
                {order.items?.map((item:any,i:number)=>(
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white font-medium">{item.menuItem?.name}</span>
                    <span className="text-gray-400 font-bold">× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <p className="font-bold text-lg" style={{color:'#00C896'}}>
                  {order.total?.toLocaleString()} so'm
                </p>
                <button onClick={()=>handleReady(order.id)}
                  className="ready-btn px-5 py-2 rounded-xl font-bold text-black"
                  style={{background:'#00C896'}}>
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
