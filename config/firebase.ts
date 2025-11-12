import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
// @ts-ignore - getReactNativePersistence pode não estar nos tipos da versão atual
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

import { firebaseEnv } from './env';

const firebaseConfig: FirebaseOptions = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
};

// Inicializar Firebase apenas se não foi inicializado
let app;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Configurar Firebase Auth com persistência usando AsyncStorage
  // Isso garante que o login seja mantido entre sessões do app
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch {
    // Fallback para getAuth se initializeAuth falhar
    auth = getAuth(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { auth };
export default app; 