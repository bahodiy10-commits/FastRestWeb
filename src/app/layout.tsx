'use client'
import './globals.css'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState('')

  useEffect(() => {
    // localStorage dan tezkor o'qi
    try { const v = localStorage.getItem('menuBackground'); if(v) setBg(v) } catch(e){}
    // Firestore dan sync
    const unsub = onSnapshot(doc(db, 'settings', 'background'), snap => {
      if (snap.exists()) {
        const img = snap.data().image || ''
        if (img) { setBg(img); try { localStorage.setItem('menuBackground', img) } catch(e){} }
        else { setBg(''); try { localStorage.removeItem('menuBackground') } catch(e){} }
      }
    })
    return unsub
  }, [])

  return (
    <html lang="uz">
      <body style={{ background: '#0B0B0F', minHeight: '100vh', position: 'relative' }}>
        {bg && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 0,
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
      </body>
    </html>
  )
}
