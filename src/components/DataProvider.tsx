'use client'
import { useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useDataStore } from '@/store/useDataStore'
import { MenuItem, Order } from '@/types'

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const { setMenu, setOrders, setTables } = useDataStore()

  useEffect(() => {
    // Barcha ma'lumotlar bir vaqtda yuklanadi — app start bo'lganda
    const u1 = onSnapshot(collection(db, 'menu'), snap => {
      setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)))
    })
    const u2 = onSnapshot(collection(db, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
    })
    const u3 = onSnapshot(collection(db, 'tables'), snap => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)))
    })
    return () => { u1(); u2(); u3() }
  }, [])

  return <>{children}</>
}
