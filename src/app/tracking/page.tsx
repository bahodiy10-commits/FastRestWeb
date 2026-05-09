'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Gateway {
  id: string; name: string; type: string
  active: boolean; merchantId?: string; serviceId?: string; mode?: string
}

function TrackingContent() {
  const [status, setStatus] = useState('new')
  const [order, setOrder] = useState<any>(null)
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [paid, setPaid] = useState(false)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')

  useEffect(() => {
    if (orderId) localStorage.setItem('lastOrderId', orderId)
  }, [orderId])

  const savedId = orderId || (typeof window!=='undefined' ? localStorage.getItem('lastOrderId') : null)

  useEffect(() => {
    if (!savedId) return
    const unsub = onSnapshot(doc(db,'orders',savedId),(snap)=>{
      if(snap.exists()){
        const data = snap.data()
        setOrder({id:snap.id,...data})
        setStatus(data.status)
        if(data.status==='ready' && !paid) setShowPayment(true)
        if(data.status==='paid') { setShowPayment(false); setPaid(true) }
      }
    })
    return unsub
  }, [savedId])

  useEffect(() => {
    const unsub = onSnapshot(collection(db,'paymentGateways'),snap=>{
      setGateways(snap.docs.map(d=>({id:d.id,...d.data()} as Gateway)).filter(g=>g.active))
    })
    return unsub
  }, [])

  const handlePay = async (method: string) => {
    if (!order) return
    const gw = gateways.find(g=>g.type===method)
    const amount = order.total * 100

    if (method==='payme' && gw) {
      const params = btoa(JSON.stringify({m:gw.merchantId,ac:{order_id:order.id},a:amount}))
      window.open(`https://checkout.paycom.uz/${params}`,'_blank')
    } else if (method==='click' && gw) {
      const url = `https://my.click.uz/services/pay?service_id=${gw.serviceId}&merchant_id=${gw.merchantId}&amount=${order.total}&transaction_param=${order.id}&return_url=${encodeURIComponent(window.location.href)}`
      window.open(url,'_blank')
    } else if (method==='uzum' && gw) {
      window.open(`https://checkout.uzum.uz/pay?merchant_id=${gw.merchantId}&amount=${amount}&order_id=${order.id}`,'_blank')
    }

    if (method==='cash') {
      await updateDoc(doc(db,'orders',order.id),{status:'paid',paymentMethod:'cash'})
      setPaid(true); setShowPayment(false)
    } else {
      await updateDoc(doc(db,'orders',order.id),{status:'paid',paymentMethod:method})
      setPaid(true); setShowPayment(false)
    }
  }

  const steps = [
    {key:'new',label:'Qabul qilindi'},
    {key:'preparing',label:'Tayyorlanmoqda'},
    {key:'ready',label:'Tayyor'},
  ]
  const currentStep = steps.findIndex(s=>s.key===status)

  const statusConfig: Record<string,any> = {
    new:{icon:'📋',title:'Buyurtma qabul qilindi!',desc:'Oshxona ko\'rib chiqmoqda...',color:'#D4AF37'},
    preparing:{icon:'👨‍🍳',title:'Tayyorlanmoqda!',desc:'Oshpaz tayyorlamoqda...',color:'#3B82F6'},
    ready:{icon:'🔔',title:'Buyurtma tayyor!',desc:'To\'lov qiling va oling!',color:'#00C896'},
    paid:{icon:'✅',title:'To\'landi! Rahmat!',desc:'Yana keling!',color:'#00C896'},
  }
  const info = statusConfig[status]||statusConfig.new

  const payColors: Record<string,string> = {click:'#00AAFF',payme:'#00AAFF',uzum:'#FF6B00',cash:'#00C896'}
  const payIcons: Record<string,string> = {click:'💳',payme:'💳',uzum:'🟠',cash:'💵'}

  if (!savedId) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'#0B0B0F'}}>
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-white text-lg font-bold mb-2">Buyurtma topilmadi</p>
        <Link href="/menu"><button className="px-6 py-3 rounded-2xl font-bold text-black" style={{background:'#D4AF37'}}>Menyuga o'tish</button></Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col p-4" style={{background:'#0B0B0F'}}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes ringBell{0%,100%{transform:rotate(0)}10%{transform:rotate(15deg)}20%{transform:rotate(-15deg)}30%{transform:rotate(10deg)}40%{transform:rotate(-10deg)}50%{transform:rotate(0)}}
        .status-card{animation:bounceIn 0.6s ease}
        .pay-modal{animation:fadeIn 0.25s ease}
        .pay-card{animation:scaleIn 0.3s ease}
        .pay-btn{transition:transform 0.15s ease,box-shadow 0.15s ease}
        .pay-btn:active{transform:scale(0.95)}
        .pay-btn:hover{box-shadow:0 4px 20px rgba(0,0,0,0.3)}
        .pulse-dot{animation:pulse 2s infinite}
        .bell{animation:ringBell 1s ease 0.5s}
        .slide-up{animation:slideUp 0.4s ease both}
      `}</style>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="status-card w-full max-w-sm p-6 rounded-3xl text-center mb-6"
          style={{background:'#1E1E24',border:`2px solid ${info.color}`,boxShadow:`0 0 30px ${info.color}22`}}>
          <div className={`text-7xl mb-4 ${status==='ready'?'bell':''}`}>{info.icon}</div>
          <h1 className="text-2xl font-bold mb-2" style={{color:info.color}}>{info.title}</h1>
          <p className="text-gray-400 mb-6">{info.desc}</p>

          <div className="flex justify-center items-center gap-1 mb-6">
            {steps.map((step,i)=>(
              <div key={step.key} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background:i<=currentStep?info.color:'#2A2A35',
                      color:i<=currentStep?'#000':'#666',
                      transition:'all 0.5s ease',
                      boxShadow:i===currentStep?`0 0 12px ${info.color}66`:'none',
                    }}>
                    {i<currentStep?'✓':i+1}
                  </div>
                  <span className="text-xs" style={{color:i<=currentStep?info.color:'#555'}}>{step.label}</span>
                </div>
                {i<steps.length-1&&(
                  <div className="w-8 h-0.5 mb-4" style={{background:i<currentStep?info.color:'#2A2A35',transition:'all 0.5s ease'}}/>
                )}
              </div>
            ))}
          </div>

          {order?.items&&(
            <div className="text-left space-y-2 mb-4 p-3 rounded-2xl slide-up" style={{background:'#0B0B0F'}}>
              {order.items.map((item:any,i:number)=>(
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white">{item.menuItem?.name}</span>
                  <span className="text-gray-400">× {item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{borderColor:'#2A2A35'}}>
                <span className="text-white">Jami:</span>
                <span style={{color:'#D4AF37'}}>{order.total?.toLocaleString()} so'm</span>
              </div>
            </div>
          )}

          {(status==='new'||status==='preparing')&&(
            <p className="text-xs pulse-dot" style={{color:info.color}}>● Jonli yangilanish</p>
          )}

          {status==='ready'&&!paid&&(
            <button onClick={()=>setShowPayment(true)}
              className="pay-btn mt-4 w-full p-4 rounded-2xl font-bold text-black"
              style={{background:'#00C896',boxShadow:'0 4px 20px rgba(0,200,150,0.4)'}}>
              💳 To'lov qilish
            </button>
          )}
        </div>
      </div>

      <div className="max-w-sm w-full mx-auto slide-up">
        <Link href="/menu">
          <button className="w-full p-4 rounded-2xl font-bold text-black"
            style={{background:'#D4AF37'}}>
            🍽️ Yana buyurtma berish
          </button>
        </Link>
      </div>

      {/* Payment Modal */}
      {showPayment&&(
        <div className="pay-modal fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.93)'}}>
          <div className="pay-card w-full max-w-sm p-6 rounded-3xl"
            style={{background:'#1E1E24',border:'2px solid #D4AF37',boxShadow:'0 0 40px rgba(212,175,55,0.25)'}}>
            <h2 className="text-xl font-bold text-center mb-1" style={{color:'#D4AF37'}}>💳 To'lov usuli</h2>
            <p className="text-center text-2xl font-bold mt-3 mb-6" style={{color:'#00C896'}}>
              {order?.total?.toLocaleString()} so'm
            </p>

            <div className="space-y-3">
              {gateways.filter(g=>g.type!=='cash').map(gw=>(
                <button key={gw.id} onClick={()=>handlePay(gw.type)}
                  className="pay-btn w-full p-4 rounded-2xl font-bold flex items-center justify-between"
                  style={{
                    background:`${payColors[gw.type]||'#333'}15`,
                    border:`1px solid ${payColors[gw.type]||'#333'}40`,
                    color:payColors[gw.type]||'#fff',
                  }}>
                  <span>{payIcons[gw.type]||'💳'} {gw.name}</span>
                  <span className="text-xs opacity-70">Avtomatik →</span>
                </button>
              ))}

              <button onClick={()=>handlePay('cash')}
                className="pay-btn w-full p-4 rounded-2xl font-bold flex items-center justify-between"
                style={{background:'rgba(0,200,150,0.1)',border:'1px solid rgba(0,200,150,0.3)',color:'#00C896'}}>
                <span>💵 Naqt pul</span>
                <span className="text-xs opacity-70">Qo'lda →</span>
              </button>

              <button onClick={()=>setShowPayment(false)}
                className="pay-btn w-full p-3 rounded-2xl font-bold text-gray-400"
                style={{background:'#2A2A35'}}>
                Keyinroq
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrackingPage() {
  return <Suspense><TrackingContent /></Suspense>
}
