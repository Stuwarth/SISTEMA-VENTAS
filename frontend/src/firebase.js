// Configuración de Firebase para el proyecto (pegada desde la consola)
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)
export default app

// Connect to emulators only when explicitly enabled via Vite env var
// To enable, set VITE_USE_FIREBASE_EMULATOR=true in a .env file at project root
const useEmulator = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
if (useEmulator && typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001)
  } catch (e) {
    // ignore if emulator libs not available
  }
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (e) {
    // ignore if emulator libs not available
  }
  try {
    // Auth emulator default port is 9099
    connectAuthEmulator(auth, 'http://localhost:9099')
  } catch (e) {
    // ignore if emulator libs not available
  }
}
