'use client'
import { useCartStore } from '@/store/useCartStore'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { items, updateQuantity, total, tableId, clearCart } = useCartStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleOrder = async () => {
    if (items.length === 0 || loading) return
    setLoading(true)
    try {
      const ref = await addDoc(collection(db, 'orders'), {
        tableId: tableId || 'takeaway',
        items,
        status: 'new',
        total: total(),
        type: tableId ? 'dine-in' : 'takeaway',
        createdAt: Date.now(),
      })
      clearCart()
      setSuccess(true)
      setTimeout(() => {
        router.push(`/tracking?id=${ref.id}`)
      }, 800)
    } catch (e: any) {
      alert('Xato: ' + (e?.message || 'Noma\'lum xato'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0B0B0F' }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cart-item { animation: slideUp 0.4s ease both; }
        .cart-item:nth-child(1) { animation-delay: 0.05s; }
        .cart-item:nth-child(2) { animation-delay: 0.1s; }
        .cart-item:nth-child(3) { animation-delay: 0.15s; }
        .cart-item:nth-child(4) { animation-delay: 0.2s; }
        .order-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .order-btn:not(:disabled):active { transform: scale(0.97); }
        .qty-btn { transition: transform 0.1s ease; }
        .qty-btn:active { transform: scale(0.88); }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .success-icon { animation: successPop 0.5s ease both; }
        .header-anim { animation: slideUp 0.3s ease both; }
        .total-card { animation: slideUp 0.5s 0.3s ease both; }
      `}</style>

      <div className="header-anim flex items-center gap-3 mb-6 pt-2">
        <Link href={tableId ? `/menu?table=${tableId}` : '/menu'}>
          <button className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#1E1E24', border: '1px solid #2A2A35', color: '#fff', fontSize: 18 }}>
            ←
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>🛒 Savatcha</h1>
          {items.length > 0 && <p className="text-xs" style={{ color: '#666' }}>{items.length} ta mahsulot</p>}
        </div>
      </div>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', animation: 'fadeIn 0.3s ease' }}>
          <div className="text-center success-icon">
            <div className="text-8xl mb-4">✅</div>
            <p className="text-white text-xl font-bold">Buyurtma qabul qilindi!</p>
            <p className="text-gray-400 text-sm mt-2">Yo'naltirilmoqda...</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20" style={{ animation: 'slideUp 0.5s ease' }}>
          <div className="text-7xl mb-4">🛒</div>
          <p className="text-gray-400 mb-2 text-lg">Savatcha bo'sh</p>
          <p className="text-gray-600 text-sm mb-8">Menyudan mahsulot tanlang</p>
          <Link href={tableId ? `/menu?table=${tableId}` : '/menu'}>
            <button className="order-btn px-8 py-3 rounded-2xl font-bold text-black"
              style={{ background: '#D4AF37' }}>
              🍽️ Menyuga qaytish
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {items.map((item, idx) => (
              <div key={item.menuItem.id} className="cart-item p-4 rounded-2xl"
                style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-3">
                    <p className="text-white font-bold">{item.menuItem.name}</p>
                    <p style={{ color: '#D4AF37' }} className="text-sm mt-1">
                      {item.menuItem.price?.toLocaleString()} so'm × {item.quantity}
                    </p>
                    <p className="font-bold text-sm mt-0.5" style={{ color: '#00C896' }}>
                      = {(item.menuItem.price * item.quantity)?.toLocaleString()} so'm
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="qty-btn w-9 h-9 rounded-full font-bold text-black flex items-center justify-center"
                      style={{ background: '#D4AF37' }}
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>−</button>
                    <span className="text-white w-6 text-center font-bold">{item.quantity}</span>
                    <button className="qty-btn w-9 h-9 rounded-full font-bold text-black flex items-center justify-center"
                      style={{ background: '#D4AF37' }}
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="total-card p-4 rounded-2xl mb-6"
            style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Jami:</span>
              <span className="text-xl font-bold" style={{ color: '#D4AF37' }}>
                {total().toLocaleString()} so'm
              </span>
            </div>
            {tableId && (
              <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid #2A2A35' }}>
                <span className="text-gray-400 text-sm">Stol:</span>
                <span className="text-white text-sm font-bold">#{tableId.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          <button onClick={handleOrder} disabled={loading || success}
            className="order-btn w-full p-4 rounded-2xl font-bold text-black text-lg flex items-center justify-center gap-3"
            style={{
              background: loading || success ? '#8a7020' : '#D4AF37',
              cursor: loading || success ? 'not-allowed' : 'pointer',
            }}>
            {loading ? <><span className="spinner" /> Yuborilmoqda...</>
              : success ? '✅ Qabul qilindi!'
              : `✅ Buyurtma berish — ${total().toLocaleString()} so'm`}
          </button>
        </>
      )}
    </div>
  )
}
