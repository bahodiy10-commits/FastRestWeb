'use client'
import { useEffect, useState, useRef } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MenuItem } from '@/types'

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'',description:'',price:'',category:'',prepTime:'',image:''})
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,'menu'),snap=>{
      setItems(snap.docs.map(d=>({id:d.id,...d.data()} as MenuItem)))
    })
    return unsub
  },[])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setForm(f=>({...f,image:base64}))
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if(!form.name||!form.price) return
    setSaving(true)
    try {
      await addDoc(collection(db,'menu'),{
        name:form.name, description:form.description,
        price:parseInt(form.price),
        category:form.category||'Asosiy',
        prepTime:parseInt(form.prepTime)||10,
        available:true,
        image:form.image||'',
      })
      setForm({name:'',description:'',price:'',category:'',prepTime:'',image:''})
      setImagePreview('')
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const toggleAvailable = async (id:string,available:boolean) => {
    await updateDoc(doc(db,'menu',id),{available:!available})
  }

  const deleteItem = async (id:string) => {
    await deleteDoc(doc(db,'menu',id))
  }

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .item-card{animation:slideUp 0.4s ease both;transition:transform 0.2s}
        .item-card:hover{transform:translateY(-2px)}
        .item-card:nth-child(1){animation-delay:0.03s}
        .item-card:nth-child(2){animation-delay:0.06s}
        .item-card:nth-child(3){animation-delay:0.09s}
        .item-card:nth-child(4){animation-delay:0.12s}
        .item-card:nth-child(n+5){animation-delay:0.15s}
        .btn{transition:transform 0.15s ease,opacity 0.15s}
        .btn:active{transform:scale(0.93)}
        .input-f{transition:border-color 0.2s}
        .input-f:focus{border-color:rgba(212,175,55,0.6)!important;outline:none;box-shadow:0 0 0 3px rgba(212,175,55,0.1)}
        .img-upload{transition:border-color 0.2s,background 0.2s}
        .img-upload:hover{border-color:rgba(212,175,55,0.5)!important;background:rgba(212,175,55,0.05)}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#D4AF37'}}>🍽️ Menyu</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} ta mahsulot</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          className="btn px-4 py-2 rounded-xl font-bold text-black"
          style={{background:'#D4AF37'}}>
          + Qo'shish
        </button>
      </div>

      {showForm&&(
        <div className="p-4 rounded-2xl mb-6" style={{background:'#1E1E24',border:'1px solid #2A2A35',animation:'slideUp 0.3s ease'}}>
          <p className="text-white font-bold mb-4">➕ Yangi mahsulot</p>

          {/* Image upload */}
          <div onClick={()=>fileRef.current?.click()}
            className="img-upload w-full h-36 rounded-2xl mb-3 flex items-center justify-center cursor-pointer overflow-hidden"
            style={{border:'2px dashed #333',background:'#0B0B0F'}}>
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl"/>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-1">📷</div>
                <p className="text-gray-500 text-sm">Rasm yuklash</p>
                <p className="text-gray-700 text-xs mt-1">JPG, PNG</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>

          <div className="space-y-2">
            {[
              {key:'name',placeholder:'Nomi *',type:'text'},
              {key:'description',placeholder:'Tavsif',type:'text'},
              {key:'price',placeholder:'Narxi (so\'m) *',type:'number'},
              {key:'category',placeholder:'Kategoriya (Suyuq, Ichimlik...)',type:'text'},
              {key:'prepTime',placeholder:'Tayyorlanish vaqti (daqiqa)',type:'number'},
            ].map(f=>(
              <input key={f.key} type={f.type} placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e=>setForm({...form,[f.key]:e.target.value})}
                className="input-f w-full p-3 rounded-xl text-white"
                style={{background:'#0B0B0F',border:'1px solid #333'}}/>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="btn flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
              style={{background:saving?'#8a7020':'#D4AF37'}}>
              {saving?<><span className="spinner"/>Saqlanmoqda...</>:'✅ Saqlash'}
            </button>
            <button onClick={()=>{setShowForm(false);setImagePreview('');setForm({name:'',description:'',price:'',category:'',prepTime:'',image:''})}}
              className="btn flex-1 py-3 rounded-xl text-white"
              style={{background:'#2A2A35'}}>
              Bekor
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map(item=>(
          <div key={item.id} className="item-card rounded-2xl overflow-hidden"
            style={{background:'#1E1E24',border:'1px solid #2A2A35'}}>
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-28 object-cover"/>
            ) : (
              <div className="w-full h-28 flex items-center justify-center text-4xl"
                style={{background:'#0B0B0F'}}>🍽️</div>
            )}
            <div className="p-3">
              <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
              <p className="font-bold mt-1 text-sm" style={{color:'#D4AF37'}}>{item.price?.toLocaleString()} so'm</p>
              <p className="text-gray-600 text-xs mt-0.5">{item.category} • {item.prepTime} daq</p>
              <div className="flex gap-1 mt-2">
                <button onClick={()=>toggleAvailable(item.id,item.available)}
                  className="btn flex-1 py-1 rounded-lg text-xs font-medium"
                  style={{background:item.available?'rgba(0,200,150,0.15)':'rgba(255,77,109,0.15)',
                    color:item.available?'#00C896':'#FF4D6D'}}>
                  {item.available?'✅':'❌'}
                </button>
                <button onClick={()=>deleteItem(item.id)}
                  className="btn px-2 py-1 rounded-lg text-xs"
                  style={{background:'rgba(255,77,109,0.15)',color:'#FF4D6D'}}>
                  🗑
                </button>
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
