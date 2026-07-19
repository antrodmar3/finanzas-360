export interface AuthUser {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
}

interface FirebaseUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

interface FirebaseAuth {
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void
  setPersistence: (persistence: string) => Promise<void>
  signInWithPopup: (provider: unknown) => Promise<unknown>
  signInWithRedirect: (provider: unknown) => Promise<void>
  signOut: () => Promise<void>
}

interface FirebaseCompat {
  apps: unknown[]
  initializeApp: (config: Record<string, string>) => unknown
  auth: (() => FirebaseAuth) & {
    Auth: { Persistence: { LOCAL: string } }
    GoogleAuthProvider: new () => { setCustomParameters: (params: Record<string, string>) => void }
  }
}

declare global {
  interface Window { firebase?: FirebaseCompat }
}

const firebaseConfig = {
  apiKey: 'AIzaSyCUaQK1m4A3tfBiqGfFbOhGxUNZEyKRCbw',
  authDomain: 'finanzas-360-antrodmar3.firebaseapp.com',
  projectId: 'finanzas-360-antrodmar3',
  storageBucket: 'finanzas-360-antrodmar3.firebasestorage.app',
  messagingSenderId: '190642600246',
  appId: '1:190642600246:web:7c22315ee64b46ec589b97',
}

function getFirebase() {
  if (!window.firebase) throw new Error('No se pudo cargar Firebase. Comprueba tu conexión e inténtalo de nuevo.')
  if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig)
  return window.firebase
}

function auth() {
  return getFirebase().auth()
}

function normalizeUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName || 'Inversor',
    email: user.email || '',
    photoURL: user.photoURL,
  }
}

export async function observeAuth(callback: (user: AuthUser | null) => void) {
  const firebase = getFirebase()
  const instance = firebase.auth()
  await instance.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  return instance.onAuthStateChanged((user) => callback(user ? normalizeUser(user) : null))
}

export async function signInWithGoogle() {
  const firebase = getFirebase()
  const provider = new firebase.auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    await auth().signInWithPopup(provider)
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await auth().signInWithRedirect(provider)
      return
    }
    throw error
  }
}

export function signOut() {
  return auth().signOut()
}
