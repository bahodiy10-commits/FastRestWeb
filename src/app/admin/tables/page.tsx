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

const APP_URL = 'https://fast-rest-web.vercel.app'

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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Table | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'tables'),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table))
        data.sort((a, b) => b.createdAt - a.createdAt)
        setTables(data)
        setError('')
      },
      (err) => {
        setError('Firestore xatosi: ' + err.message)
      }
    )
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
        number: num,
        room: room.trim(),
        status: 'available',
        qrUrl: '',
        qrImage: '',
        createdAt: Date.now(),
      })
      const realUrl = `${APP_URL}/menu?table=${ref.id}`
      const realQrImage = await makeQrImage(realUrl)
      await updateDoc(doc(db, 'tables', ref.id), { qrUrl: realUrl, qrImage: realQrImage })
      setNumber('')
      setRoom('')
    } catch (e: any) {
      const msg = e?.message || JSON.stringify(e)
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Firebase ruxsat xatosi — Firebase Console → Firestore → Rules tekshiring')
      } else {
        setError('Xato: ' + msg)
      }
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError('')
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'tables', id))
      if (preview?.id === id) setPreview(null)
    } catch (e: any) {
      const msg = e?.message || JSON.stringify(e)
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Firebase ruxsat xatosi — Rules tekshiring')
      } else {
        setError("O'chirishda xato: " + msg)
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ background: 'transparent' }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .table-card {
          animation: slideUp 0.4s ease both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .table-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .table-card:nth-child(1) { animation-delay: 0.05s; }
        .table-card:nth-child(2) { animation-delay: 0.1s; }
        .table-card:nth-child(3) { animation-delay: 0.15s; }
        .table-card:nth-child(4) { animation-delay: 0.2s; }
        .table-card:nth-child(n+5) { animation-delay: 0.25s; }
        .action-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .action-btn:active { transform: scale(0.9); }
        .add-btn { transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .add-btn:not(:disabled):hover { box-shadow: 0 4px 20px rgba(212,175,55,0.35); }
        .add-btn:not(:disabled):active { transform: scale(0.97); }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.25);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .qr-thumb { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .qr-thumb:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(212,175,55,0.4); }
        .modal-overlay { animation: fadeIn 0.25s ease; }
        .modal-card { animation: scaleIn 0.3s ease; }
        .input-field { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .input-field:focus {
          border-color: rgba(212,175,55,0.6) !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.1);
          outline: none;
        }
        .skeleton {
          background: linear-gradient(90deg, #1E1E24 25%, #2A2A35 50%, #1E1E24 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .error-anim { animation: slideUp 0.25s ease; }
      `}</style>

      <div className="mb-6 pt-2 flex items-center justify-between" style={{ animation: 'slideUp 0.3s ease' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>🪑 Stollar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tables.length} ta stol</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
          {tables.filter(t => t.status === 'available').length} bo'sh
        </div>
      </div>

      <div className="p-4 rounded-2xl mb-6" style={{ background: '#1E1E24', border: '1px solid #2A2A35', animation: 'slideUp 0.35s ease' }}>
        <p className="text-white font-bold mb-3">➕ Yangi stol qo'shish</p>
        <div className="flex gap-3 mb-3">
          <input type="number" placeholder="№" value={number} min={1}
            onChange={e => setNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="input-field w-20 p-3 rounded-xl text-white"
            style={{ background: 'transparent', border: '1px solid #333' }} />
          <input type="text" placeholder="Xona nomi (VIP, Asosiy...)" value={room}
            onChange={e => setRoom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="input-field flex-1 p-3 rounded-xl text-white"
            style={{ background: 'transparent', border: '1px solid #333' }} />
        </div>

        {error && (
          <div className="error-anim mb-3 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(255,77,109,0.08)', color: '#FF4D6D', border: '1px solid rgba(255,77,109,0.25)' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleAdd} disabled={adding}
          className="add-btn w-full p-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
          style={{ background: adding ? '#8a7020' : '#D4AF37', cursor: adding ? 'not-allowed' : 'pointer' }}>
          {adding ? <><span className="spinner" /> Yaratilmoqda...</> : "✅ Stol qo'shish"}
        </button>
      </div>

      <div className="space-y-3">
        {tables.length === 0 && !error && (
          <div className="text-center py-20" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="text-5xl mb-3">🪑</div>
            <p className="text-gray-500">Hech qanday stol yo'q</p>
          </div>
        )}

        {tables.map(table => (
          <div key={table.id}
            className="table-card p-4 rounded-2xl flex items-center gap-4"
            style={{ background: '#1E1E24', border: '1px solid #2A2A35' }}>
            {table.qrImage ? (
              <img src={table.qrImage} alt="QR" onClick={() => setPreview(table)}
                className="qr-thumb rounded-xl shrink-0"
                style={{ width: 56, height: 56, border: '2px solid #D4AF37' }} />
            ) : (
              <div className="skeleton rounded-xl shrink-0 flex items-center justify-center text-gray-600 text-xs"
                style={{ width: 56, height: 56 }}>⏳</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">{table.room} — Stol #{table.number}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#D4AF37', opacity: 0.7 }}>
                {table.qrUrl || 'QR tayyorlanmoqda...'}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium"
                style={{
                  background: table.status === 'available' ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,109,0.12)',
                  color: table.status === 'available' ? '#00C896' : '#FF4D6D',
                }}>
                {table.status === 'available' ? '● Bo\'sh' : '● Band'}
              </span>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => table.qrImage && setPreview(table)}
                className="action-btn px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: table.qrImage ? '#D4AF37' : '#2A2A35', color: table.qrImage ? '#000' : '#555' }}>
                👁 Ko'rish
              </button>
              <button onClick={() => table.qrImage && downloadPng(table.qrImage, `stol-${table.room}-${table.number}.png`)}
                className="action-btn px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(0,200,150,0.12)', color: '#00C896' }}>
                ⬇ Yuklab
              </button>
              <button onClick={() => handleDelete(table.id)} disabled={deleting === table.id}
                className="action-btn px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,77,109,0.15)', color: '#FF4D6D', opacity: deleting === table.id ? 0.5 : 1 }}>
                {deleting === table.id ? '...' : "🗑 O'chir"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setPreview(null)}>
          <div className="modal-card p-6 rounded-3xl max-w-sm w-full text-center"
            style={{ background: '#1E1E24', border: '2px solid #D4AF37' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-bold text-xl mb-1" style={{ color: '#D4AF37' }}>
              {preview.room} — Stol #{preview.number}
            </p>
            <p className="text-gray-500 text-xs mb-5 break-all">{preview.qrUrl}</p>
            <img src={preview.qrImage} alt="QR" className="mx-auto rounded-2xl mb-5"
              style={{ width: 220, height: 220, border: '4px solid #D4AF37', boxShadow: '0 0 40px rgba(212,175,55,0.3)' }} />
            <div className="flex gap-3">
              <button onClick={() => downloadPng(preview.qrImage, `stol-${preview.room}-${preview.number}.png`)}
                className="add-btn flex-1 p-3 rounded-xl font-bold text-black" style={{ background: '#D4AF37' }}>
                ⬇ PNG yuklab olish
              </button>
              <button onClick={() => setPreview(null)}
                className="action-btn px-4 rounded-xl font-bold" style={{ background: '#2A2A35', color: '#fff' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
