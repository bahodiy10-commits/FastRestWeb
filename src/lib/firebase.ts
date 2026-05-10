import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableNetwork, connectFirestoreEmulator } from 'firebase/firestore'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyARexBtYfSJTnSod24OQudviRQvWGjEKvM",
  authDomain: "fastrest-7b5aa.firebaseapp.com",
  projectId: "fastrest-7b5aa",
  storageBucket: "fastrest-7b5aa.firebasestorage.app",
  messagingSenderId: "711659144425",
  appId: "1:711659144425:web:924ba0e8a424f44cf81c78"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// Persistent cache — offline ham ishlaydi, sahifalar orasida tez
export const db = getApps().length === 1 && !getApps()[0].name.includes('cache')
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : getFirestore(app)

export default app
