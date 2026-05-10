'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function BgWrapper({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState('')

  useEffect(() => {
    try { const v = localStorage.getItem('menuBackground'); if (v) setBg(v) } catch(e) {}
    const unsub = onSnapshot(doc(db, 'settings', 'background'), snap => {
      if (snap.exists()) {
        const img = snap.data().image || ''
        setBg(img)
        try {
          if (img) localStorage.setItem('menuBackground', img)
          else localStorage.removeItem('menuBackground')
        } catch(e) {}
      }
    })
    return unsub
  }, [])

  return (
    <>
      {bg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.28,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {children}
      </div>
    </>
  )
}
