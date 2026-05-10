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

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'bg-style'
    if (bg) {
      style.textContent = `
        html::before {
          content: '';
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background-image: url('${bg}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.32;
          z-index: -1;
          pointer-events: none;
          will-change: transform;
          transform: translateZ(0);
        }
      `
    } else {
      style.textContent = ''
    }
    const old = document.getElementById('bg-style')
    if (old) old.remove()
    document.head.appendChild(style)
  }, [bg])

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {children}
    </div>
  )
}
