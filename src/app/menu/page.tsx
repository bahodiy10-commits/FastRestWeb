'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MenuItem } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function MenuContent() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Hammasi')
  const [bg, setBg] = useState('')
  const { addItem, items, setTableId } = useCartStore()
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')

  useEffect(()=>{
    if(tableId) setTableId(tableId)
    const unsub = onSnapshot(collection(db,'menu'),snap=>{
      setMenu(snap.docs.map(d=>({id:d.id,...d.data()} as MenuItem)))
    })
    const unsub2 = onSnapshot(collection(db,'settings'),snap=>{
      snap.docs.forEach(d=>{ if(d.id==='background') setBg(d.data().image||'') })
    })
    return ()=>{ unsub(); unsub2() }
  },[tableId])

  const categories = ['Hammasi',...Array.from(new Set(menu.map(m=>m.category)))]
  const filtered = menu.filter(m=>m.available)
    .filter(m=>category==='Hammasi'||m.category===category)
    .filter(m=>m.name.toLowerCase().includes(search.toLowerCase()))

  const cartCount = items.reduce((s,i)=>s+i.quantity,0)
  const cartTotal = items.reduce((s,i)=>s+i.menuItem.price*i.quantity,0)

  return (
    <div className="min-h-screen pb-24" style={{background:'#0B0B0F',backgroundImage:bg?`url(${bg})`:'none',backgroundSize:'cover',backgroundAttachment:'fixed'}}>
      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes cartPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
        .header{animation:slideDown 0.4s ease}
        .menu-card{animation:slideUp 0.4s ease both;transition:transform 0.2s,box-shadow 0.2s}
        .menu-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.5)}
        .menu-card:nth-child(odd){animation-delay:0.03s}
        .menu-card:nth-child(even){animation-delay:0.06s}
        .add-btn{transition:transform 0.15s ease,box-shadow 0.15s ease}
        .add-btn:active{transform:scale(0.88)}
        .qty-btn{transition:transform 0.1s ease}
        .qty-btn:active{transform:scale(0.85)}
        .cart-btn{transition:transform 0.2s ease,box-shadow 0.2s}
        .cart-btn:hover{transform:scale(1.05);box-shadow:0 4px 20px rgba(212,175,55,0.4)}
        .backdrop{background:rgba(11,11,15,0.85);backdrop-filter:blur(12px)}
      `}</style>

      <div className="header sticky top-0 p-4 z-10 backdrop">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{color:'#D4AF37'}}>🍽️ Menyu</h1>
            {tableId&&<p className="text-gray-400 text-xs">Stol #{tableId.slice(0,8)}</p>}
          </div>
          {cartCount>0&&(
            <Link href="/cart">
              <button className="cart-btn px-4 py-2 rounded-xl font-bold text-black text-sm"
                style={{background:'#D4AF37'}}>
                🛒 {cartCount} • {cartTotal.toLocaleString()} so'm
              </button>
            </Link>
          )}
        </div>
        <input placeholder="🔍 Qidirish..." value={search}
          onChange={e=>setSearch(e.target.value)}
          className="w-full p-3 rounded-2xl text-white outline-none mb-3"
          style={{background:'rgba(30,30,36,0.9)',border:'1px solid #2A2A35'}}/>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat=>(
            <button key={cat} onClick={()=>setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-medium"
              style={{
                background:category===cat?'#D4AF37':'rgba(30,30,36,0.9)',
                color:category===cat?'#000':'#fff',
                border:category===cat?'none':'1px solid #2A2A35',
                transition:'all 0.2s ease',
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {filtered.map(item=>{
          const qty = items.find(i=>i.menuItem.id===item.id)?.quantity||0
          return (
            <div key={item.id} className="menu-card rounded-2xl overflow-hidden"
              style={{background:'rgba(30,30,36,0.95)',border:'1px solid #2A2A35'}}>
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-32 object-cover"/>
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-4xl"
                  style={{background:'#0B0B0F'}}>🍽️</div>
              )}
              <div className="p-3">
                <h3 className="text-white font-bold text-sm leading-tight">{item.name}</h3>
                {item.description&&<p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>}
                <p className="font-bold mt-1 text-sm" style={{color:'#D4AF37'}}>{item.price?.toLocaleString()} so'm</p>
                <div className="mt-2 flex justify-end">
                  {qty===0?(
                    <button onClick={()=>addItem(item)}
                      className="add-btn w-9 h-9 rounded-full font-bold text-black text-lg flex items-center justify-center"
                      style={{background:'#D4AF37'}}>+</button>
                  ):(
                    <div className="flex items-center gap-1">
                      <button onClick={()=>useCartStore.getState().updateQuantity(item.id,qty-1)}
                        className="qty-btn w-8 h-8 rounded-full font-bold text-black flex items-center justify-center"
                        style={{background:'#D4AF37'}}>−</button>
                      <span className="text-white w-5 text-center text-sm font-bold">{qty}</span>
                      <button onClick={()=>addItem(item)}
                        className="qty-btn w-8 h-8 rounded-full font-bold text-black flex items-center justify-center"
                        style={{background:'#D4AF37'}}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length===0&&(
          <div className="col-span-2 text-center py-16" style={{animation:'fadeIn 0.5s ease'}}>
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500">Mahsulot topilmadi</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MenuPage() {
  return <Suspense><MenuContent/></Suspense>
}
