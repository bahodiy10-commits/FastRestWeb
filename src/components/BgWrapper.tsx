'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function BgWrapper({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState('')

  useEffect(() => {
    // Tezkor: localStorage dan o'qi
    try {
      const v = localStorage.getItem('menuBackground')
      if (v) setBg(v)
    } catch(e) {}

    // Firestore real-time sync
    const unsub = onSnapshot(doc(db, 'settings', 'background'), snap => {
      if (snap.exists()) {
        const img = snap.data().image || ''
        setBg(img)
        try {
          if (img) localStorage.setItem('menuBackground', img)
          else localStorage.removeItem('menuBackground')
        } catch(e) {}
      } else {
        setBg('')
      }
    })
    return unsub
  }, [])

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {bg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.25,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
