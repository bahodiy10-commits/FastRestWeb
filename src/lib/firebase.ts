import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const db = getFirestore(app)
export default app
