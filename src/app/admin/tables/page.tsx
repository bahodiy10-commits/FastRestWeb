'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import QRCode from 'qrcode'

interface Table {
  id: string
  number: number
  room: string
  status: 'available' | 'occupied'
  qrUrl: string
  qrImage: string
  createdAt: number
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://fastrest.app').replace(/\/$/, '')

async function makeQrImage(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 512, margin: 2, errorCorrectionLevel: 'H',
    color: { dark: '#0B0B0F', light: '#F5F5F7' },
  })
}

function downloadPng(base64: string, filename: string) {
  const a = document.createElement('a')
  a.href = base64
  a.download = filename
  a.click()
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [number, setNumber] = useState('')
  const [room, setRoom] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Table | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tables'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table))
      data.sort((a, b) => b.createdAt - a.createdAt)
      setTables(data)
    })
    return unsub
  }, [])

  const handleAdd = async () => {
    setError('')
    const num = parseInt(number.trim())
    if (!num || num <= 0) return setError("To'g'ri stol raqami kiriting")
    if (!room.trim()) return setError('Xona nomini kiriting')
    const exists = tables.some(t => t.number === num && t.room.toLowerCase() === room.trim().toLowerCase())
    if (exists) return setError(`"${room}" xonasida ${num}-stol allaqachon bor`)
    setAdding(true)
    try {
      const ref = await addDoc(collection(db, 'tables'), {
        number: num, room: room.trim(), status: 'available',
        qrUrl: '', qrImage: '', createdAt: Date.now(),
      })
      const qrUrl = `${APP_URL}/menu?table=${ref.id}`
      const qrImage = await makeQrImage(qrUrl)
      await updateDoc(doc(db, 'tables', ref.id), { qrUrl, qrImage })
      setNumber('')
      setRoom('')
    } catch (e) {
      console.error(e)
      setError('QR yaratishda xato yuz berdi')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu stolni o'chirishni tasdiqlaysizmi?")) return
    await deleteDoc(doc(db, 'tables', id))
    if (preview?.id === id) setPreview(null)
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0B0B0F' }}>
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>🪑 Stollar</h1>
        <p className="text-gray-400 text-sm mt-1">{tables.length} ta stol</p>
      </div>

      <div className="p-4 rounded-2xl mb-6" style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
        <p className="text-white font-bold mb-3">➕ Yangi stol</p>
        <div className="flex gap-3 mb-3">
          <input type="number" placeholder="Stol №" value={number} min={1}
            onChange={e => setNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-24 p-3 rounded-xl text-white outline-none"
            style={{ background: '#0B0B0F', border: '1px solid #333' }} />
          <input type="text" placeholder="Xona (VIP, Asosiy...)" value={room}
            onChange={e => setRoom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 p-3 rounded-xl text-white outline-none"
            style={{ background: '#0B0B0F', border: '1px solid #333' }} />
        </div>
        {error && <p className="text-red-400 text-sm mb-3">⚠️ {error}</p>}
        <button onClick={handleAdd} disabled={adding}
          className="w-full p-3 rounded-xl font-bold text-black"
          style={{ background: adding ? '#8a7020' : '#D4AF37', cursor: adding ? 'not-allowed' : 'pointer' }}>
          {adding ? '⏳ QR yaratilmoqda...' : "✅ Stol qo'shish"}
        </button>
      </div>

      <div className="space-y-3">
        {tables.length === 0 && (
          <p className="text-gray-500 text-center py-16">Hech qanday stol yo'q</p>
        )}
        {tables.map(table => (
          <div key={table.id} className="p-4 rounded-2xl flex items-center gap-4"
            style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
            {table.qrImage ? (
              <img src={table.qrImage} alt="QR" onClick={() => setPreview(table)}
                className="rounded-xl cursor-pointer shrink-0"
                style={{ width: 56, height: 56, border: '2px solid #D4AF37' }} />
            ) : (
              <div className="rounded-xl flex items-center justify-center text-xs text-gray-500 shrink-0"
                style={{ width: 56, height: 56, background: '#111' }}>⏳</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">{table.room} — Stol #{table.number}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#D4AF37' }}>{table.qrUrl || 'Yaratilmoqda...'}</p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: table.status === 'available' ? 'rgba(0,200,150,0.15)' : 'rgba(255,77,109,0.15)', color: table.status === 'available' ? '#00C896' : '#FF4D6D' }}>
                {table.status === 'available' ? "🟢 Bo'sh" : '🔴 Band'}
              </span>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => table.qrImage && setPreview(table)} disabled={!table.qrImage}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: table.qrImage ? '#D4AF37' : '#333', color: table.qrImage ? '#000' : '#666' }}>
                👁 Ko'rish
              </button>
              <button onClick={() => table.qrImage && downloadPng(table.qrImage, `stol-${table.room}-${table.number}.png`)}
                disabled={!table.qrImage} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(0,200,150,0.12)', color: table.qrImage ? '#00C896' : '#444' }}>
                ⬇ Yuklab
              </button>
              <button onClick={() => handleDelete(table.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,77,109,0.1)', color: '#FF4D6D' }}>
                🗑 O'chir
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.88)' }} onClick={() => setPreview(null)}>
          <div className="p-6 rounded-3xl max-w-sm w-full text-center"
            style={{ background: '#1E1E24', border: '1px solid #D4AF37' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-bold text-xl mb-1" style={{ color: '#D4AF37' }}>
              {preview.room} — Stol #{preview.number}
            </p>
            <p className="text-gray-400 text-xs mb-5 break-all">{preview.qrUrl}</p>
            <img src={preview.qrImage} alt="QR" className="mx-auto rounded-2xl mb-5"
              style={{ width: 220, height: 220, border: '4px solid #D4AF37' }} />
            <div className="flex gap-3">
              <button onClick={() => downloadPng(preview.qrImage, `stol-${preview.room}-${preview.number}.png`)}
                className="flex-1 p-3 rounded-xl font-bold text-black" style={{ background: '#D4AF37' }}>
                ⬇ PNG yuklab olish
              </button>
              <button onClick={() => setPreview(null)} className="px-4 rounded-xl font-bold"
                style={{ background: '#2A2A35', color: '#fff' }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
