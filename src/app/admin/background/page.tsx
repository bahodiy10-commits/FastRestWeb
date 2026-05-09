'use client'
import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Rasmni compress qilish
async function compressImage(base64: string, maxWidth = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = base64
  })
}

export default function BackgroundPage() {
  const [current, setCurrent] = useState('')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [size, setSize] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // localStorage dan o'qi
    const saved = localStorage.getItem('menuBackground')
    if (saved) setCurrent(saved)

    // Firestore signal kuzat (boshqa qurilmalar uchun)
    const unsub = onSnapshot(doc(db, 'settings', 'background'), snap => {
      if (snap.exists() && snap.data().url) {
        setCurrent(snap.data().url)
      }
    })
    return unsub
  }, [])

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string
      const compressed = await compressImage(raw)
      setPreview(compressed)
      const kb = Math.round((compressed.length * 3) / 4 / 1024)
      setSize(kb > 1024 ? `${(kb/1024).toFixed(1)} MB` : `${kb} KB`)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    try {
      // localStorage ga saqlash (tezkor, offline)
      localStorage.setItem('menuBackground', preview)
      setCurrent(preview)

      // Firestore ga faqat signal (timestamp) — rasm emas
      await setDoc(doc(db, 'settings', 'background'), {
        url: preview.slice(0, 100), // faqat signal
        updatedAt: Date.now(),
        hasImage: true,
      })
      setPreview('')
      setSize('')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    localStorage.removeItem('menuBackground')
    setCurrent('')
    setPreview('')
    setSize('')
    await setDoc(doc(db, 'settings', 'background'), { hasImage: false, updatedAt: Date.now() })
  }

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
        .btn{transition:transform 0.15s ease,box-shadow 0.15s}
        .btn:active{transform:scale(0.95)}
        .upload-area{transition:border-color 0.2s,background 0.2s}
        .upload-area:hover{border-color:rgba(212,175,55,0.5)!important;background:rgba(212,175,55,0.03)!important}
      `}</style>

      <div className="mb-6 pt-2" style={{animation:'slideUp 0.3s ease'}}>
        <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>🖼️ Orqa fon</h1>
        <p className="text-gray-500 text-sm mt-0.5">Menyu sahifasi orqa foni</p>
      </div>

      {current && (
        <div className="mb-6 rounded-2xl overflow-hidden" style={{animation:'fadeIn 0.4s ease',border:'1px solid #2A2A35'}}>
          <div className="relative">
            <img src={current} alt="bg" className="w-full h-48 object-cover"/>
            <div className="absolute inset-0 flex items-center justify-center"
              style={{background:'rgba(0,0,0,0.45)'}}>
              <p className="text-white font-bold text-lg">✅ Joriy orqa fon</p>
            </div>
          </div>
          <div className="p-3" style={{background:'#1E1E24'}}>
            <button onClick={handleDelete}
              className="btn w-full py-2 rounded-xl text-sm font-bold"
              style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>
              🗑 O'chirish
            </button>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl" style={{background:'#1E1E24',border:'1px solid #2A2A35',animation:'slideUp 0.4s ease'}}>
        <p className="text-white font-bold mb-4">📤 Yangi rasm yuklash</p>

        <div onClick={() => fileRef.current?.click()}
          className="upload-area w-full h-48 rounded-2xl mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{border:'2px dashed #333',background:'#0B0B0F'}}>
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover"/>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-2">🖼️</div>
              <p className="text-gray-300 font-medium">Rasm tanlash</p>
              <p className="text-gray-600 text-sm mt-1">JPG, PNG, WEBP • Auto siqiladi</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>

        {size && (
          <p className="text-center text-xs mb-3" style={{color:'#D4AF37'}}>
            📦 Hajm: {size} (siqilgandan keyin)
          </p>
        )}

        {preview && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="btn flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
              style={{background:saving?'#8a7020':'#D4AF37'}}>
              {saving ? <><span className="spinner"/>Saqlanmoqda...</> : '✅ Saqlash'}
            </button>
            <button onClick={() => {setPreview(''); setSize('')}}
              className="btn px-4 py-3 rounded-xl font-bold"
              style={{background:'#2A2A35',color:'#fff'}}>
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-xl text-xs space-y-1"
        style={{background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)',color:'#D4AF37'}}>
        <p>💡 Rasm qurilmada saqlanadi (localStorage)</p>
        <p>⚡ Tez yuklash uchun avtomatik siqiladi</p>
        <p>📱 Har bir qurilmada bir marta o'rnatiladi</p>
      </div>
    </div>
  )
}
