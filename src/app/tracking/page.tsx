'use client'
import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'

export default function TrackingPage() {
  const [status, setStatus] = useState('new')

  const statusInfo: Record<string, { icon: string, title: string, desc: string, color: string }> = {
    new: { icon: '📋', title: 'Buyurtma qabul qilindi!', desc: 'Oshxona ko\'rib chiqmoqda...', color: '#D4AF37' },
    preparing: { icon: '👨‍🍳', title: 'Tayyorlanmoqda!', desc: 'Oshxona tayyorlamoqda...', color: '#3B82F6' },
    ready: { icon: '🎉', title: 'Tayyor!', desc: 'Buyurtmangiz tayyor!', color: '#00C896' },
    paid: { icon: '✅', title: 'To\'landi!', desc: 'Rahmat! Yana keling!', color: '#00C896' },
  }

  const info = statusInfo[status] || statusInfo.new

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{background: '#0B0B0F'}}>
      <div className="text-center">
        <div className="text-8xl mb-6">{info.icon}</div>
        <h1 className="text-2xl font-bold mb-2" style={{color: info.color}}>{info.title}</h1>
        <p className="text-gray-400 mb-8">{info.desc}</p>

        <div className="flex justify-center gap-2 mb-8">
          {['new', 'preparing', 'ready'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full"
                style={{background: ['new', 'preparing', 'ready'].indexOf(status) >= i ? info.color : '#333'}}/>
              {i < 2 && <div className="w-8 h-0.5" style={{background: '#333'}}/>}
            </div>
          ))}
        </div>

        <Link href="/menu">
          <button className="px-8 py-3 rounded-2xl font-bold text-black"
            style={{background: '#D4AF37'}}>
            Menyuga qaytish
          </button>
        </Link>
      </div>
    </div>
  )
}
