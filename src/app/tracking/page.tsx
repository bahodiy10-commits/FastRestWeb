'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TrackingContent() {
  const [status, setStatus] = useState('new')
  const [order, setOrder] = useState<any>(null)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')

  // orderId ni localStorage ga saqla
  useEffect(() => {
    if (orderId) {
      localStorage.setItem('lastOrderId', orderId)
    }
  }, [orderId])

  const savedOrderId = orderId || (typeof window !== 'undefined' ? localStorage.getItem('lastOrderId') : null)

  useEffect(() => {
    if (!savedOrderId) return
    const unsub = onSnapshot(doc(db, 'orders', savedOrderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setOrder({ id: snap.id, ...data })
        setStatus(data.status)
      }
    })
    return unsub
  }, [savedOrderId])

  const steps = [
    { key: 'new', label: 'Qabul qilindi' },
    { key: 'preparing', label: 'Tayyorlanmoqda' },
    { key: 'ready', label: 'Tayyor' },
  ]
  const currentStep = steps.findIndex(s => s.key === status)

  const statusConfig: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    new: { icon: '📋', title: 'Buyurtma qabul qilindi!', desc: 'Oshxona ko\'rib chiqmoqda...', color: '#D4AF37' },
    preparing: { icon: '👨‍🍳', title: 'Tayyorlanmoqda!', desc: 'Oshpaz tayyorlamoqda, biroz kuting...', color: '#3B82F6' },
    ready: { icon: '🎉', title: 'Buyurtma tayyor!', desc: 'To\'lov amalga oshirilmoqda...', color: '#00C896' },
    paid: { icon: '✅', title: 'To\'landi!', desc: 'Rahmat! Yana keling!', color: '#00C896' },
  }

  const info = statusConfig[status] || statusConfig.new

  if (!savedOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0B0B0F' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-white text-lg font-bold mb-2">Buyurtma topilmadi</p>
          <p className="text-gray-500 text-sm mb-6">QR kodni qayta skaner qiling</p>
          <Link href="/menu">
            <button className="px-6 py-3 rounded-2xl font-bold text-black" style={{ background: '#D4AF37' }}>
              🍽️ Menyuga o'tish
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col p-4" style={{ background: '#0B0B0F' }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .status-card { animation: bounceIn 0.6s ease; }
        .step-done { transition: all 0.5s ease; }
        .pulse-anim { animation: pulse 2s infinite; }
        .slide-up { animation: slideUp 0.4s ease both; }
      `}</style>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="status-card w-full max-w-sm p-6 rounded-3xl text-center mb-6"
          style={{ background: '#1E1E24', border: `2px solid ${info.color}`, boxShadow: `0 0 30px ${info.color}22` }}>
          <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}>{info.icon}</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: info.color }}>{info.title}</h1>
          <p className="text-gray-400 mb-6">{info.desc}</p>

          {/* Progress */}
          <div className="flex justify-center items-center gap-1 mb-6">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold step-done"
                    style={{
                      background: i <= currentStep ? info.color : '#2A2A35',
                      color: i <= currentStep ? '#000' : '#666',
                    }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs" style={{ color: i <= currentStep ? info.color : '#555' }}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-8 h-0.5 mb-4 step-done"
                    style={{ background: i < currentStep ? info.color : '#2A2A35' }} />
                )}
              </div>
            ))}
          </div>

          {/* Order items */}
          {order?.items && (
            <div className="text-left space-y-2 mb-4 p-3 rounded-2xl slide-up" style={{ background: '#0B0B0F' }}>
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

          {order?.tableInfo && (
            <p className="text-gray-500 text-sm">{order.tableInfo}</p>
          )}

          {status === 'new' || status === 'preparing' ? (
            <p className="text-xs mt-3 pulse-anim" style={{ color: info.color }}>
              ● Jonli yangilanish
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 max-w-sm w-full mx-auto slide-up">
        <Link href="/menu">
          <button className="w-full p-4 rounded-2xl font-bold text-black"
            style={{ background: '#D4AF37' }}>
            🍽️ Yana buyurtma berish
          </button>
        </Link>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return <Suspense><TrackingContent /></Suspense>
}
