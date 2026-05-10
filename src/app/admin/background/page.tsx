'use client'
import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
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
    const unsub = onSnapshot(doc(db, 'settings', 'background'), snap => {
      if (snap.exists()) {
        const img = snap.data().image || ''
        setCurrent(img)
        try { if(img) localStorage.setItem('menuBackground', img) } catch(e){}
      }
    })
    return unsub
  }, [])

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target?.result as string)
      setPreview(compressed)
      const kb = Math.round(compressed.length * 0.75 / 1024)
      setSize(kb > 1024 ? `${(kb/1024).toFixed(1)} MB` : `${kb} KB`)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'background'), { image: preview, updatedAt: Date.now() })
      try { localStorage.setItem('menuBackground', preview) } catch(e){}
      setCurrent(preview)
      setPreview('')
      setSize('')
    } catch(e: any) {
      alert('Xato: ' + e.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await setDoc(doc(db, 'settings', 'background'), { image: '', updatedAt: Date.now() })
    try { localStorage.removeItem('menuBackground') } catch(e){}
    setCurrent('')
  }

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
        .btn{transition:transform 0.15s ease}.btn:active{transform:scale(0.95)}
        .upload-area{transition:border-color 0.2s,background 0.2s}
        .upload-area:hover{border-color:rgba(212,175,55,0.5)!important}
      `}</style>

      <div className="mb-6 pt-2" style={{animation:'slideUp 0.3s ease'}}>
        <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>🖼️ Orqa fon</h1>
        <p className="text-gray-500 text-sm mt-0.5">Barcha sahifalar orqa foni</p>
      </div>

      {current && (
        <div className="mb-6 rounded-2xl overflow-hidden" style={{animation:'fadeIn 0.4s ease',border:'1px solid #2A2A35'}}>
          <div className="relative">
            <img src={current} alt="bg" className="w-full h-48 object-cover"/>
            <div className="absolute inset-0 flex items-center justify-center"
              style={{background:'rgba(0,0,0,0.5)'}}>
              <p className="text-white font-bold">✅ Joriy orqa fon</p>
            </div>
          </div>
          <div className="p-3" style={{background:'#1E1E24'}}>
            <button onClick={handleDelete} className="btn w-full py-2 rounded-xl text-sm font-bold"
              style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>
              🗑 O'chirish
            </button>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl" style={{background:'#1E1E24',border:'1px solid #2A2A35'}}>
        <p className="text-white font-bold mb-4">📤 Rasm yuklash</p>
        <div onClick={() => fileRef.current?.click()}
          className="upload-area w-full h-48 rounded-2xl mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{border:'2px dashed #333',background:'transparent'}}>
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover"/>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-2">🖼️</div>
              <p className="text-gray-300 font-medium">Rasm tanlash</p>
              <p className="text-gray-600 text-xs mt-1">800px ga siqiladi • ~100KB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>

        {size && <p className="text-center text-xs mb-3" style={{color:'#D4AF37'}}>📦 {size}</p>}

        {preview && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="btn flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
              style={{background:saving?'#8a7020':'#D4AF37'}}>
              {saving ? <><span className="spinner"/>Saqlanmoqda...</> : '✅ Saqlash'}
            </button>
            <button onClick={() => {setPreview('');setSize('')}}
              className="btn px-4 py-3 rounded-xl font-bold" style={{background:'#2A2A35',color:'#fff'}}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
