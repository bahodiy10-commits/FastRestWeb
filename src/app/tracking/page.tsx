'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCartStore } from '@/store/useCartStore'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TrackingContent() {
  const [status, setStatus] = useState('new')
  const [order, setOrder] = useState<any>(null)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const { tableId } = useCartStore()

  useEffect(() => {
    if (!orderId) return
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setOrder({ id: snap.id, ...data })
        setStatus(data.status)
      }
    })
    return unsub
  }, [orderId])

  const steps = [
    { key: 'new', icon: '📋', label: 'Qabul qilindi' },
    { key: 'preparing', icon: '👨‍🍳', label: 'Tayyorlanmoqda' },
    { key: 'ready', icon: '✅', label: 'Tayyor' },
  ]

  const currentStep = steps.findIndex(s => s.key === status)

  const statusConfig: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    new: {
      icon: '📋',
      title: 'Buyurtma qabul qilindi!',
      desc: 'Oshxona ko\'rib chiqmoqda...',
      color: '#D4AF37',
    },
    preparing: {
      icon: '👨‍🍳',
      title: 'Tayyorlanmoqda!',
      desc: 'Oshpaz tayyorlamoqda, biroz kuting...',
      color: '#3B82F6',
    },
    ready: {
      icon: '🎉',
      title: 'Buyurtma tayyor ✅',
      desc: 'Birozdan so\'ng yetib keladi',
      color: '#00C896',
    },
    paid: {
      icon: '✅',
      title: 'To\'landi!',
      desc: 'Rahmat! Yana keling!',
      color: '#00C896',
    },
  }

  const info = statusConfig[status] || statusConfig.new

  return (
    <div className="min-h-screen flex flex-col p-4" style={{ background: '#0B0B0F' }}>

      {/* Status Card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="w-full max-w-sm p-6 rounded-3xl text-center mb-6"
          style={{ background: '#1E1E24', border: `1px solid ${info.color}` }}
        >
          <div className="text-7xl mb-4">{info.icon}</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: info.color }}>
            {info.title}
          </h1>
          <p className="text-gray-400 mb-6">{info.desc}</p>

          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-1 mb-6">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500"
                    style={{
                      background: i <= currentStep ? info.color : '#2A2A35',
                      color: i <= currentStep ? '#000' : '#666',
                    }}
                  >
                    {i < currentStep ? '✓' : step.icon}
                  </div>
                  <span className="text-xs" style={{ color: i <= currentStep ? info.color : '#555' }}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-8 h-0.5 mb-4 transition-all duration-500"
                    style={{ background: i < currentStep ? info.color : '#2A2A35' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Order Items */}
          {order?.items && (
            <div className="text-left space-y-2 mb-4 p-3 rounded-2xl" style={{ background: '#0B0B0F' }}>
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white">{item.menuItem?.name}</span>
                  <span className="text-gray-400">× {item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{ borderColor: '#2A2A35' }}>
                <span className="text-white">Jami:</span>
                <span style={{ color: '#D4AF37' }}>{order.total?.toLocaleString()} so'm</span>
              </div>
            </div>
          )}

          {order?.tableId && (
            <p className="text-gray-500 text-sm">Stol #{order.tableId}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 max-w-sm w-full mx-auto">
        <Link href={tableId ? `/menu?table=${tableId}` : '/menu'}>
          <button
            className="w-full p-4 rounded-2xl font-bold text-black"
            style={{ background: '#D4AF37' }}
          >
            🍽️ Yana buyurtma berish
          </button>
        </Link>
        {orderId && (
          <Link href={`/tracking?id=${orderId}`}>
            <button
              className="w-full p-4 rounded-2xl font-bold"
              style={{ background: '#1E1E24', color: '#00C896', border: '1px solid #00C896' }}
            >
              🔄 Buyurtmani kuzatish
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return <Suspense><TrackingContent /></Suspense>
}
