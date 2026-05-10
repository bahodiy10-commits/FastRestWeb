'use client'
import { useState, useRef } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useDataStore } from '@/store/useDataStore'
import { MenuItem } from '@/types'

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 500
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

export default function AdminMenuPage() {
  const { menu: items } = useDataStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'',description:'',price:'',category:'',prepTime:'',image:''})
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target?.result as string)
      setForm(f=>({...f, image: compressed}))
      setImagePreview(compressed)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setError('')
    if(!form.name.trim()) return setError('Nom kiritish shart')
    if(!form.price) return setError('Narx kiritish shart')
    setSaving(true)
    try {
      await addDoc(collection(db,'menu'),{
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseInt(form.price),
        category: form.category.trim() || 'Asosiy',
        prepTime: parseInt(form.prepTime) || 10,
        available: true,
        image: form.image || '',
        createdAt: Date.now(),
      })
      setForm({name:'',description:'',price:'',category:'',prepTime:'',image:''})
      setImagePreview('')
      setShowForm(false)
    } catch(e:any) {
      setError('Xato: ' + (e?.message || JSON.stringify(e)))
    } finally { setSaving(false) }
  }

  const toggleAvailable = async (id:string, available:boolean) => {
    await updateDoc(doc(db,'menu',id), {available: !available})
  }

  const deleteItem = async (id:string) => {
    if(!confirm('O\'chirilsinmi?')) return
    await deleteDoc(doc(db,'menu',id))
  }

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .item-card{animation:slideUp 0.35s ease both;transition:transform 0.2s,box-shadow 0.2s}
        .item-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.4)}
        .item-card:nth-child(1){animation-delay:0.03s}.item-card:nth-child(2){animation-delay:0.06s}
        .item-card:nth-child(3){animation-delay:0.09s}.item-card:nth-child(n+4){animation-delay:0.12s}
        .btn{transition:transform 0.15s ease}.btn:active{transform:scale(0.93)}
        .input-f{transition:border-color 0.2s}
        .input-f:focus{border-color:rgba(212,175,55,0.6)!important;outline:none;box-shadow:0 0 0 3px rgba(212,175,55,0.1)}
        .img-area{transition:border-color 0.2s}.img-area:hover{border-color:rgba(212,175,55,0.5)!important}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>🍽️ Menyu</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} ta mahsulot</p>
        </div>
        <button onClick={()=>{setShowForm(!showForm);setError('')}}
          className="btn px-4 py-2 rounded-xl font-bold text-black"
          style={{background:'#D4AF37'}}>
          {showForm ? '✕ Yopish' : '+ Qo\'shish'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-2xl mb-6"
          style={{background:'rgba(30,30,36,0.97)',border:'1px solid #2A2A35',animation:'slideUp 0.3s ease'}}>
          <p className="text-white font-bold mb-4">➕ Yangi mahsulot</p>
          <div onClick={()=>fileRef.current?.click()}
            className="img-area w-full h-36 rounded-2xl mb-3 flex items-center justify-center cursor-pointer overflow-hidden"
            style={{border:'2px dashed #444',background:'rgba(0,0,0,0.3)'}}>
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt=""/>
            ) : (
              <div className="text-center pointer-events-none">
                <div className="text-3xl mb-1">📷</div>
                <p className="text-gray-400 text-sm">Rasm yuklash</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>
          <div className="space-y-2 mb-3">
            {([
              {key:'name',ph:'Nomi *',type:'text'},
              {key:'description',ph:'Tavsif',type:'text'},
              {key:'price',ph:"Narxi (so'm) *",type:'number'},
              {key:'category',ph:'Kategoriya',type:'text'},
              {key:'prepTime',ph:'Tayyorlanish vaqti (daq)',type:'number'},
            ] as {key:string,ph:string,type:string}[]).map(f=>(
              <input key={f.key} type={f.type} placeholder={f.ph}
                value={form[f.key as keyof typeof form]}
                onChange={e=>setForm({...form,[f.key]:e.target.value})}
                className="input-f w-full p-3 rounded-xl text-white"
                style={{background:'rgba(0,0,0,0.4)',border:'1px solid #444'}}/>
            ))}
          </div>
          {error && <div className="mb-3 p-3 rounded-xl text-xs" style={{background:'rgba(255,77,109,0.1)',color:'#FF4D6D'}}>⚠️ {error}</div>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="btn flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
              style={{background:saving?'#8a7020':'#D4AF37'}}>
              {saving?<><span className="spinner"/>Saqlanmoqda...</>:'✅ Saqlash'}
            </button>
            <button onClick={()=>{setShowForm(false);setImagePreview('');setError('')}}
              className="btn flex-1 py-3 rounded-xl text-white" style={{background:'#333'}}>Bekor</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map(item=>(
          <div key={item.id} className="item-card rounded-2xl overflow-hidden"
            style={{background:'rgba(30,30,36,0.97)',border:'1px solid #2A2A35'}}>
            {item.image?(
              <img src={item.image} alt={item.name} className="w-full h-28 object-cover" loading="lazy"/>
            ):(
              <div className="w-full h-28 flex items-center justify-center text-4xl" style={{background:'rgba(0,0,0,0.3)'}}>🍽️</div>
            )}
            <div className="p-3">
              <p className="text-white font-bold text-sm">{item.name}</p>
              <p className="font-bold mt-1 text-sm" style={{color:'#D4AF37'}}>{item.price?.toLocaleString()} so'm</p>
              <p className="text-gray-600 text-xs">{item.category} • {item.prepTime} daq</p>
              <div className="flex gap-1 mt-2">
                <button onClick={()=>toggleAvailable(item.id,item.available)}
                  className="btn flex-1 py-1 rounded-lg text-xs font-medium"
                  style={{background:item.available!==false?'rgba(0,200,150,0.15)':'rgba(255,77,109,0.15)',
                    color:item.available!==false?'#00C896':'#FF4D6D'}}>
                  {item.available!==false?'✅ Bor':'❌ Yo\'q'}
                </button>
                <button onClick={()=>deleteItem(item.id)} className="btn px-2 py-1 rounded-lg text-xs"
                  style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        {items.length===0&&(
          <div className="col-span-2 text-center py-16" style={{animation:'fadeIn 0.5s ease'}}>
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-gray-500">Menyu bo'sh</p>
          </div>
        )}
      </div>
    </div>
  )
}
