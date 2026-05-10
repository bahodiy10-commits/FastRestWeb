'use client'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function BgWrapper({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState('')

  useEffect(() => {
    try {
      const v = localStorage.getItem('menuBackground')
      if (v) setBg(v)
    } catch(e) {}

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
    const el = document.getElementById('global-bg')
    if (el) {
      if (bg) {
        el.style.backgroundImage = `url(${bg})`
        el.style.opacity = '0.32'
      } else {
        el.style.backgroundImage = 'none'
        el.style.opacity = '0'
      }
    }
  }, [bg])

  return <>{children}</>
}
