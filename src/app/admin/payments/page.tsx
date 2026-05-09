'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Gateway {
  id: string
  name: string
  type: 'click' | 'payme' | 'uzum' | 'cash'
  active: boolean
  merchantId: string
  serviceId: string
  secretKey: string
  mode: 'test' | 'live'
}

const GW_TYPES = [
  { value: 'click', label: 'Click', color: '#00AAFF', icon: '💳' },
  { value: 'payme', label: 'Payme', color: '#00AAFF', icon: '💳' },
  { value: 'uzum', label: 'Uzum Bank', color: '#FF6B00', icon: '🟠' },
  { value: 'cash', label: 'Naqt pul', color: '#00C896', icon: '💵' },
]

export default function PaymentsPage() {
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Gateway | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'click', merchantId: '', serviceId: '', secretKey: '', mode: 'test', active: true
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'paymentGateways'), snap => {
      setGateways(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gateway)))
    })
    return unsub
  }, [])

  const resetForm = () => {
    setForm({ name: '', type: 'click', merchantId: '', serviceId: '', secretKey: '', mode: 'test', active: true })
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name) return
    const data = {
      name: form.name,
      type: form.type,
      merchantId: form.merchantId,
      serviceId: form.serviceId,
      secretKey: form.secretKey,
      mode: form.mode,
      active: form.active,
    }
    if (editing) {
      await updateDoc(doc(db, 'paymentGateways', editing.id), data)
    } else {
      await addDoc(collection(db, 'paymentGateways'), data)
    }
    resetForm()
  }

  const handleEdit = (gw: Gateway) => {
    setForm({
      name: gw.name, type: gw.type,
      merchantId: gw.merchantId || '', serviceId: gw.serviceId || '',
      secretKey: gw.secretKey || '', mode: gw.mode || 'test', active: gw.active
    })
    setEditing(gw)
    setShowForm(true)
  }

  const handleToggle = async (gw: Gateway) => {
    await updateDoc(doc(db, 'paymentGateways', gw.id), { active: !gw.active })
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'paymentGateways', id))
  }

  const getTypeInfo = (type: string) => GW_TYPES.find(g => g.value === type) || GW_TYPES[0]

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .gw-card { animation: slideUp 0.4s ease both; transition: transform 0.2s; }
        .gw-card:nth-child(1) { animation-delay: 0.05s; }
        .gw-card:nth-child(2) { animation-delay: 0.1s; }
        .gw-card:nth-child(3) { animation-delay: 0.15s; }
        .toggle { transition: all 0.3s ease; }
        .btn { transition: transform 0.15s ease, opacity 0.15s; }
        .btn:active { transform: scale(0.95); }
        .input-f { transition: border-color 0.2s ease; }
        .input-f:focus { border-color: rgba(212,175,55,0.6) !important; outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#D4AF37' }}>💳 To'lov tizimlari</h1>
          <p className="text-gray-500 text-sm mt-0.5">{gateways.filter(g => g.active).length} ta faol</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="btn px-4 py-2 rounded-xl font-bold text-black"
          style={{ background: '#D4AF37' }}>
          + Qo'shish
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 rounded-2xl mb-6" style={{ background: '#1E1E24', border: '1px solid #2A2A35', animation: 'slideUp 0.3s ease' }}>
          <p className="text-white font-bold mb-4">{editing ? '✏️ Tahrirlash' : '➕ Yangi to\'lov tizimi'}</p>

          <div className="space-y-3">
            <input placeholder="Nomi (masalan: Payme asosiy)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-f w-full p-3 rounded-xl text-white"
              style={{ background: '#0B0B0F', border: '1px solid #333' }} />

            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
              className="input-f w-full p-3 rounded-xl text-white"
              style={{ background: '#0B0B0F', border: '1px solid #333' }}>
              {GW_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>

            {form.type !== 'cash' && (
              <>
                <input placeholder="Merchant ID" value={form.merchantId}
                  onChange={e => setForm({ ...form, merchantId: e.target.value })}
                  className="input-f w-full p-3 rounded-xl text-white"
                  style={{ background: '#0B0B0F', border: '1px solid #333' }} />
                {form.type === 'click' && (
                  <input placeholder="Service ID" value={form.serviceId}
                    onChange={e => setForm({ ...form, serviceId: e.target.value })}
                    className="input-f w-full p-3 rounded-xl text-white"
                    style={{ background: '#0B0B0F', border: '1px solid #333' }} />
                )}
                <input placeholder="Secret Key" value={form.secretKey} type="password"
                  onChange={e => setForm({ ...form, secretKey: e.target.value })}
                  className="input-f w-full p-3 rounded-xl text-white"
                  style={{ background: '#0B0B0F', border: '1px solid #333' }} />
                <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as any })}
                  className="input-f w-full p-3 rounded-xl text-white"
                  style={{ background: '#0B0B0F', border: '1px solid #333' }}>
                  <option value="test">🧪 Test rejim</option>
                  <option value="live">🟢 Live rejim</option>
                </select>
              </>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm({ ...form, active: !form.active })}
                className="toggle w-12 h-6 rounded-full relative"
                style={{ background: form.active ? '#00C896' : '#333' }}>
                <div className="toggle absolute top-1 w-4 h-4 rounded-full bg-white"
                  style={{ left: form.active ? '28px' : '4px' }} />
              </div>
              <span className="text-white text-sm">{form.active ? 'Faol' : 'Nofaol'}</span>
            </label>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave}
              className="btn flex-1 py-3 rounded-xl font-bold text-black"
              style={{ background: '#D4AF37' }}>
              {editing ? '💾 Saqlash' : '✅ Qo\'shish'}
            </button>
            <button onClick={resetForm}
              className="btn flex-1 py-3 rounded-xl text-white"
              style={{ background: '#2A2A35' }}>
              Bekor
            </button>
          </div>
        </div>
      )}

      {/* Gateways list */}
      <div className="space-y-3">
        {gateways.length === 0 && (
          <div className="text-center py-16" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="text-5xl mb-3">💳</div>
            <p className="text-gray-500">To'lov tizimi qo'shilmagan</p>
          </div>
        )}
        {gateways.map(gw => {
          const typeInfo = getTypeInfo(gw.type)
          return (
            <div key={gw.id} className="gw-card p-4 rounded-2xl"
              style={{ background: '#1E1E24', border: `1px solid ${gw.active ? typeInfo.color + '40' : '#2A2A35'}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${typeInfo.color}15` }}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold">{gw.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: typeInfo.color }}>{typeInfo.label}</p>
                  </div>
                </div>
                <div onClick={() => handleToggle(gw)}
                  className="toggle w-12 h-6 rounded-full relative cursor-pointer"
                  style={{ background: gw.active ? '#00C896' : '#333' }}>
                  <div className="toggle absolute top-1 w-4 h-4 rounded-full bg-white"
                    style={{ left: gw.active ? '28px' : '4px' }} />
                </div>
              </div>

              {gw.type !== 'cash' && gw.merchantId && (
                <div className="p-2 rounded-lg mb-3 text-xs space-y-1"
                  style={{ background: '#0B0B0F' }}>
                  <p className="text-gray-400">Merchant ID: <span className="text-white">{gw.merchantId}</span></p>
                  {gw.serviceId && <p className="text-gray-400">Service ID: <span className="text-white">{gw.serviceId}</span></p>}
                  <p className="text-gray-400">Rejim: <span style={{ color: gw.mode === 'live' ? '#00C896' : '#D4AF37' }}>
                    {gw.mode === 'live' ? '🟢 Live' : '🧪 Test'}
                  </span></p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => handleEdit(gw)}
                  className="btn flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                  ✏️ Tahrirlash
                </button>
                <button onClick={() => handleDelete(gw.id)}
                  className="btn px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(255,77,109,0.15)', color: '#FF4D6D' }}>
                  🗑
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
