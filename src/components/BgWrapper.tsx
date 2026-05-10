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

  // bg ni body ga style sifatida qo'yamiz — eng barqaror usul
  useEffect(() => {
    if (bg) {
      document.body.style.backgroundImage = `url(${bg})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundRepeat = 'no-repeat'
      document.body.style.backgroundAttachment = 'scroll'
    } else {
      document.body.style.backgroundImage = 'none'
    }
    return () => {
      document.body.style.backgroundImage = 'none'
    }
  }, [bg])

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {children}
    </div>
  )
}
