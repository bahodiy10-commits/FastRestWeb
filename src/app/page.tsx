'use client'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUser({ uid: result.user.uid, email, role: userData.role, name: userData.name })
        if (userData.role === 'admin') router.push('/admin')
        else if (userData.role === 'kitchen') router.push('/kitchen')
        else router.push('/menu')
      }
    } catch(e) {
      setError('Email yoki parol noto\'g\'ri')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .login-card{animation:slideUp 0.5s ease}
        .btn{transition:transform 0.15s ease,box-shadow 0.2s}
        .btn:active{transform:scale(0.97)}
        .btn:hover{box-shadow:0 4px 20px rgba(212,175,55,0.35)}
        .input-f{transition:border-color 0.2s,box-shadow 0.2s}
        .input-f:focus{border-color:rgba(212,175,55,0.6)!important;outline:none;box-shadow:0 0 0 3px rgba(212,175,55,0.1)}
        .spinner{width:18px;height:18px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <div className="login-card w-full max-w-md p-8 rounded-3xl"
        style={{background:'rgba(30,30,36,0.95)',border:'1px solid #2A2A35',backdropFilter:'blur(20px)'}}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-3xl font-bold" style={{color:'#D4AF37'}}>FastRest</h1>
          <p className="text-gray-400 mt-1">Tizimga kirish</p>
        </div>

        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            className="input-f w-full p-4 rounded-2xl text-white"
            style={{background:'rgba(0,0,0,0.4)',border:'1px solid #333'}}/>
          <input type="password" placeholder="Parol" value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            className="input-f w-full p-4 rounded-2xl text-white"
            style={{background:'rgba(0,0,0,0.4)',border:'1px solid #333'}}/>

          {error && (
            <p className="text-sm text-center px-3 py-2 rounded-xl"
              style={{background:'rgba(255,77,109,0.1)',color:'#FF4D6D'}}>
              ⚠️ {error}
            </p>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="btn w-full p-4 rounded-2xl font-bold text-black text-lg flex items-center justify-center gap-2"
            style={{background:loading?'#8a7020':'#D4AF37',cursor:loading?'not-allowed':'pointer'}}>
            {loading ? <><span className="spinner"/>Kirish...</> : 'Kirish'}
          </button>
        </div>
      </div>
    </div>
  )
}
