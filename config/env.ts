const getEnvVar = (key: string, options?: { fallback?: string }): string => {
  const value = process.env[key] ?? options?.fallback;

  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }

  return value;
};

export const firebaseEnv = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export const apiUrlEnv = getEnvVar('EXPO_PUBLIC_API_URL');

export { getEnvVar };

