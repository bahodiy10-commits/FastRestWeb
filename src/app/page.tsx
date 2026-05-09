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
    } catch (e) {
      setError('Email yoki parol noto\'g\'ri')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: '#0B0B0F'}}>
      <div className="w-full max-w-md p-8 rounded-3xl" style={{background: '#1E1E24'}}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍽️</div>
          <h1 className="text-3xl font-bold" style={{color: '#D4AF37'}}>FastRest</h1>
          <p className="text-gray-400 mt-1">Tizimga kirish</p>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl text-white outline-none"
            style={{background: '#0B0B0F', border: '1px solid #333'}}
          />
          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl text-white outline-none"
            style={{background: '#0B0B0F', border: '1px solid #333'}}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full p-4 rounded-2xl font-bold text-black"
            style={{background: '#D4AF37'}}
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </div>
      </div>
    </div>
  )
}
