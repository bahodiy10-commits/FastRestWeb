'use client'
import { useCartStore } from '@/store/useCartStore'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CartPage() {
  const { items, updateQuantity, total, tableId, clearCart } = useCartStore()
  const router = useRouter()

  const handleOrder = async () => {
    if (items.length === 0) return
    try {
      await addDoc(collection(db, 'orders'), {
        tableId: tableId || 'takeaway',
        items,
        status: 'new',
        total: total(),
        type: tableId ? 'dine-in' : 'takeaway',
        createdAt: Date.now(),
      })
      clearCart()
      router.push(`/tracking?id=${ref.id}`)
    } catch(e) {
      alert('Xato yuz berdi')
    }
  }

  return (
    <div className="min-h-screen p-4" style={{background: '#0B0B0F'}}>
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href={tableId ? `/menu?table=${tableId}` : '/menu'}>
          <button className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{background: '#1E1E24'}}>←</button>
        </Link>
        <h1 className="text-2xl font-bold" style={{color: '#D4AF37'}}>🛒 Savatcha</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-gray-400 mb-6">Savatcha bo'sh</p>
          <Link href="/menu">
            <button className="px-6 py-3 rounded-2xl font-bold text-black"
              style={{background: '#D4AF37'}}>Menyuga qaytish</button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map(item => (
              <div key={item.menuItem.id} className="p-4 rounded-2xl" style={{background: '#1E1E24'}}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-white font-bold">{item.menuItem.name}</p>
                    <p style={{color: '#D4AF37'}} className="text-sm mt-1">
                      {item.menuItem.price?.toLocaleString()} so'm × {item.quantity}
                    </p>
                    <p className="font-bold" style={{color: '#00C896'}}>
                      = {(item.menuItem.price * item.quantity)?.toLocaleString()} so'm
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-9 h-9 rounded-full font-bold text-black"
                      style={{background: '#D4AF37'}}>-</button>
                    <span className="text-white w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-full font-bold text-black"
                      style={{background: '#D4AF37'}}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl mb-6" style={{background: '#1E1E24'}}>
            <div className="flex justify-between">
              <span className="text-gray-400">Jami:</span>
              <span className="text-xl font-bold" style={{color: '#D4AF37'}}>{total().toLocaleString()} so'm</span>
            </div>
            {tableId && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Stol:</span>
                <span className="text-white">#{tableId}</span>
              </div>
            )}
          </div>

          <button onClick={handleOrder}
            className="w-full p-4 rounded-2xl font-bold text-black text-lg"
            style={{background: '#D4AF37'}}>
            ✅ Buyurtma berish — {total().toLocaleString()} so'm
          </button>
        </>
      )}
    </div>
  )
}
