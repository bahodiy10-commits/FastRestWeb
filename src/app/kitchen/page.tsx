'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Order } from '@/types'

interface PaymentGateway {
  id: string
  name: string
  type: 'click' | 'payme' | 'uzum' | 'cash'
  active: boolean
  merchantId?: string
  serviceId?: string
}

interface TableInfo {
  room: string
  number: number
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [payModal, setPayModal] = useState<Order | null>(null)
  const [tableMap, setTableMap] = useState<Record<string, TableInfo>>({})
  const [paying, setPaying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'orders'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
      setOrders(data.filter(o => o.status === 'new' || o.status === 'preparing'))
    })
    const unsub2 = onSnapshot(collection(db, 'paymentGateways'), snap => {
      setGateways(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentGateway)).filter(g => g.active))
    })
    const unsub3 = onSnapshot(collection(db, 'tables'), snap => {
      const map: Record<string, TableInfo> = {}
      snap.docs.forEach(d => {
        const data = d.data()
        map[d.id] = { room: data.room, number: data.number }
      })
      setTableMap(map)
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const getTableLabel = (tableId: string) => {
    if (!tableId || tableId === 'takeaway') return 'Olib ketish'
    const t = tableMap[tableId]
    if (t) return `${t.room} — Stol #${t.number}`
    return `Stol #${tableId.slice(0, 6)}`
  }

  const handleReady = async (order: Order) => {
    await updateDoc(doc(db, 'orders', order.id), { status: 'ready' })
    setPayModal(order)
  }

  const handlePay = async (order: Order, method: string) => {
    if (method === 'cash') {
      await updateDoc(doc(db, 'orders', order.id), { status: 'paid', paymentMethod: 'cash' })
      setPayModal(null)
      return
    }

    const gw = gateways.find(g => g.type === method)
    if (!gw) return

    const amount = order.total * 100 // tiyin
    const orderId = order.id

    if (method === 'payme') {
      const params = btoa(JSON.stringify({ m: gw.merchantId, ac: { order_id: orderId }, a: amount }))
      window.open(`https://checkout.paycom.uz/${params}`, '_blank')
    } else if (method === 'click') {
      const url = `https://my.click.uz/services/pay?service_id=${gw.serviceId}&merchant_id=${gw.merchantId}&amount=${order.total}&transaction_param=${orderId}&return_url=${encodeURIComponent(window.location.origin + '/tracking?id=' + orderId)}`
      window.open(url, '_blank')
    } else if (method === 'uzum') {
      window.open(`https://checkout.uzum.uz/pay?merchant_id=${gw.merchantId}&amount=${amount}&order_id=${orderId}`, '_blank')
    }

    await updateDoc(doc(db, 'orders', order.id), { status: 'paid', paymentMethod: method })
    setPayModal(null)
  }

  const payIcons: Record<string, string> = {
    click: '💳', payme: '💳', uzum: '🟠', cash: '💵'
  }
  const payColors: Record<string, string> = {
    click: '#00AAFF', payme: '#00AAFF', uzum: '#FF6B00', cash: '#00C896'
  }

  const handleLogout = async () => { await signOut(auth); router.push('/') }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0B0B0F' }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .order-card { animation: slideUp 0.4s ease both; transition: transform 0.2s; }
        .order-card:hover { transform: translateY(-2px); }
        .order-card:nth-child(1) { animation-delay: 0.05s; }
        .order-card:nth-child(2) { animation-delay: 0.1s; }
        .order-card:nth-child(3) { animation-delay: 0.15s; }
        .pay-modal { animation: fadeIn 0.25s ease; }
        .pay-card { animation: scaleIn 0.3s ease; }
        .pay-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .pay-btn:active { transform: scale(0.95); }
        .pay-btn:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .ready-btn { transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .ready-btn:hover { box-shadow: 0 4px 16px rgba(0,200,150,0.4); }
        .ready-btn:active { transform: scale(0.95); }
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>👨‍🍳 Oshxona</h1>
          <p className="text-gray-400 text-sm">{orders.length} ta buyurtma</p>
        </div>
        <button onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(255,77,109,0.15)', color: '#FF4D6D' }}>
          Chiqish
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32" style={{ animation: 'slideUp 0.5s ease' }}>
          <div className="text-7xl mb-4">✅</div>
          <p className="text-white text-lg font-bold">Barcha buyurtmalar bajarildi!</p>
          <p className="text-gray-500 text-sm mt-2">Yangi buyurtma kelishini kuting</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="order-card p-4 rounded-2xl"
              style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-bold text-lg" style={{ color: '#D4AF37' }}>
                    {getTableLabel(order.tableId)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('uz-UZ')}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: order.status === 'new' ? 'rgba(212,175,55,0.15)' : 'rgba(59,130,246,0.15)',
                    color: order.status === 'new' ? '#D4AF37' : '#3B82F6',
                    border: `1px solid ${order.status === 'new' ? 'rgba(212,175,55,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  }}>
                  {order.status === 'new' ? '🆕 Yangi' : '🔄 Jarayonda'}
                </span>
              </div>

              <div className="space-y-2 mb-4 p-3 rounded-xl" style={{ background: '#0B0B0F' }}>
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white font-medium">{item.menuItem?.name}</span>
                    <span className="text-gray-400">× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <p className="font-bold text-lg" style={{ color: '#00C896' }}>
                  {order.total?.toLocaleString()} so'm
                </p>
                <button onClick={() => handleReady(order)}
                  className="ready-btn px-5 py-2 rounded-xl font-bold text-black"
                  style={{ background: '#00C896' }}>
                  ✅ Tayyor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="pay-modal fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="pay-card w-full max-w-sm p-6 rounded-3xl"
            style={{ background: '#1E1E24', border: '2px solid #D4AF37', boxShadow: '0 0 40px rgba(212,175,55,0.2)' }}>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: '#D4AF37' }}>
              💳 To'lov usuli
            </h2>
            <p className="text-center text-gray-400 text-sm mb-2">{getTableLabel(payModal.tableId)}</p>
            <p className="text-center text-2xl font-bold mb-6" style={{ color: '#00C896' }}>
              {payModal.total?.toLocaleString()} so'm
            </p>

            <div className="space-y-3">
              {/* Online gateways */}
              {gateways.filter(g => g.type !== 'cash').map(gw => (
                <button key={gw.id}
                  onClick={() => handlePay(payModal, gw.type)}
                  className="pay-btn w-full p-4 rounded-2xl font-bold flex items-center justify-between"
                  style={{ background: `${payColors[gw.type]}15`, border: `1px solid ${payColors[gw.type]}40`, color: payColors[gw.type] }}>
                  <span>{payIcons[gw.type]} {gw.name}</span>
                  <span className="text-xs opacity-70">Avtomatik →</span>
                </button>
              ))}

              {/* Cash always shown */}
              <button onClick={() => handlePay(payModal, 'cash')}
                className="pay-btn w-full p-4 rounded-2xl font-bold flex items-center justify-between"
                style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)', color: '#00C896' }}>
                <span>💵 Naqt pul</span>
                <span className="text-xs opacity-70">Qo'lda →</span>
              </button>

              <button onClick={() => setPayModal(null)}
                className="pay-btn w-full p-3 rounded-2xl font-bold text-gray-400"
                style={{ background: '#2A2A35' }}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
