'use client'
import { useState } from 'react'
import { collection, writeBatch, getDocs, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useDataStore } from '@/store/useDataStore'

export default function AdminDashboard() {
  const { orders, menu, tables } = useDataStore()
  const [clearing, setClearing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const stats = {
    new: orders.filter(o=>o.status==='new').length,
    preparing: orders.filter(o=>o.status==='preparing').length,
    ready: orders.filter(o=>o.status==='ready').length,
    paid: orders.filter(o=>o.status==='paid').reduce((s,o)=>s+(o.total||0),0),
    total: orders.length,
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      const batch = writeBatch(db)
      // Buyurtmalar
      const ordersSnap = await getDocs(collection(db,'orders'))
      ordersSnap.docs.forEach(d => batch.delete(d.ref))
      // Stollar
      const tablesSnap = await getDocs(collection(db,'tables'))
      tablesSnap.docs.forEach(d => batch.delete(d.ref))
      // Menyu
      const menuSnap = await getDocs(collection(db,'menu'))
      menuSnap.docs.forEach(d => batch.delete(d.ref))
      // To'lov tizimlari
      const paySnap = await getDocs(collection(db,'paymentGateways'))
      paySnap.docs.forEach(d => batch.delete(d.ref))
      // Fon rasm
      batch.delete(doc(db,'settings','background'))
      await batch.commit()
      // localStorage ham tozala
      try { localStorage.removeItem('menuBackground') } catch(e){}
      const bgEl = document.getElementById('global-bg')
      if (bgEl) { bgEl.style.backgroundImage='none'; bgEl.style.opacity='0' }
      setShowConfirm(false)
    } finally { setClearing(false) }
  }

  const handleLogout = async () => { await signOut(auth); router.push('/') }

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .stat-card{animation:slideUp 0.4s ease both;transition:transform 0.2s}
        .stat-card:hover{transform:translateY(-2px)}
        .stat-card:nth-child(1){animation-delay:0.05s}.stat-card:nth-child(2){animation-delay:0.1s}
        .stat-card:nth-child(3){animation-delay:0.15s}.stat-card:nth-child(4){animation-delay:0.2s}
        .btn{transition:transform 0.15s ease}.btn:active{transform:scale(0.95)}
        .confirm-modal{animation:fadeIn 0.25s ease}
        .confirm-card{animation:scaleIn 0.3s ease}
        .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>FastRest</h1>
          <p className="text-gray-400 text-sm">Admin Panel</p>
        </div>
        <button onClick={handleLogout} className="btn px-4 py-2 rounded-xl text-sm font-medium"
          style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>Chiqish</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {label:'🆕 Yangi', value:stats.new, color:'#D4AF37'},
          {label:'⏳ Jarayonda', value:stats.preparing, color:'#3B82F6'},
          {label:'✅ Tayyor', value:stats.ready, color:'#00C896'},
          {label:"💰 Tushum", value:stats.paid.toLocaleString()+" so'm", color:'#D4AF37'},
        ].map((card,i)=>(
          <div key={i} className="stat-card p-4 rounded-2xl"
            style={{background:'rgba(30,30,36,0.97)',border:`1px solid ${card.color}33`}}>
            <p className="text-2xl font-bold" style={{color:card.color}}>{card.value}</p>
            <p className="text-gray-400 text-xs mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          {label:'📋 Buyurtma', value:stats.total, color:'#666'},
          {label:'🍽️ Taom', value:menu.length, color:'#666'},
          {label:'🪑 Stol', value:tables.length, color:'#666'},
        ].map((card,i)=>(
          <div key={i} className="p-3 rounded-2xl text-center"
            style={{background:'rgba(30,30,36,0.97)',border:'1px solid #2A2A35'}}>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <button onClick={()=>setShowConfirm(true)}
        className="btn w-full p-3 rounded-2xl font-bold mb-6 flex items-center justify-center gap-2"
        style={{background:'rgba(255,77,109,0.12)',color:'#FF4D6D',border:'1px solid rgba(255,77,109,0.25)'}}>
        🗑 Barcha ma'lumotlarni tozalash
      </button>

      <h2 className="text-lg font-bold text-white mb-3">Faol buyurtmalar</h2>
      <div className="space-y-3">
        {orders.filter(o=>o.status!=='paid').length===0 ? (
          <div className="text-center py-12" style={{animation:'fadeIn 0.5s ease'}}>
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-500">Hozircha buyurtma yo'q</p>
          </div>
        ) : orders.filter(o=>o.status!=='paid').map(order=>(
          <div key={order.id} className="p-4 rounded-2xl"
            style={{background:'rgba(30,30,36,0.97)',border:'1px solid #2A2A35'}}>
            <div className="flex justify-between">
              <span className="text-white font-bold">#{order.tableId?.slice(0,8)}</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{background:'#D4AF3733',color:'#D4AF37'}}>
                {order.status==='new'?'Yangi':order.status==='preparing'?'Jarayonda':'Tayyor'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{order.total?.toLocaleString()} so'm</p>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="confirm-modal fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="confirm-card w-full max-w-sm p-6 rounded-3xl text-center"
            style={{background:'rgba(30,30,36,0.99)',border:'2px solid #FF4D6D'}}>
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-white font-bold text-lg mb-2">Hamma narsani o'chirish?</h3>
            <p className="text-gray-400 text-sm mb-2">Quyidagilar o'chib ketadi:</p>
            <div className="text-left p-3 rounded-xl mb-4 space-y-1 text-sm"
              style={{background:'rgba(255,77,109,0.08)'}}>
              <p className="text-gray-300">🗑 {stats.total} ta buyurtma</p>
              <p className="text-gray-300">🍽️ {menu.length} ta taom</p>
              <p className="text-gray-300">🪑 {tables.length} ta stol</p>
              <p className="text-gray-300">💳 To'lov tizimlari</p>
              <p className="text-gray-300">🖼️ Fon rasm</p>
            </div>
            <p className="text-red-400 text-xs mb-4">Bu amalni qaytarib bo'lmaydi!</p>
            <div className="flex gap-3">
              <button onClick={handleClearAll} disabled={clearing}
                className="btn flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{background:'#FF4D6D',color:'#fff'}}>
                {clearing?<><span className="spinner"/>Tozalanmoqda...</>:'🗑 Ha, o\'chir'}
              </button>
              <button onClick={()=>setShowConfirm(false)}
                className="btn flex-1 py-3 rounded-xl font-bold"
                style={{background:'#2A2A35',color:'#fff'}}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
