import { auth } from '@/config/firebase';
import { UserProfile, getUserProfile } from '@/services/auth';
import { clearUserProfileCache } from '@/services/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, onAuthStateChanged } from 'firebase/auth';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  profileLoading: boolean;
  refreshToken: () => Promise<void>;
  fetchUserProfile: (forceCache?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = '@qrgest:auth_user';
const TOKEN_STORAGE_KEY = '@qrgest:auth_token';
const MAX_FETCH_PROFILE_RETRIES = 4;
const FETCH_PROFILE_RETRY_DELAY = 2000;
const INITIAL_PROFILE_FETCH_DELAY = 1500;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken(true);
        setIdToken(token);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch (error) {
        console.error('Erro ao atualizar token:', error);
        setIdToken(null);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } else {
      setIdToken(null);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const fetchUserProfile = React.useCallback(
    async (forceCache: boolean = false) => {
      if (!idToken) return;

      const attemptFetch = async (attempt: number): Promise<void> => {
        if (attempt === 0) {
          setProfileLoading(true);
        }

        let shouldRetry = false;

        try {
          const isRecentSignUp =
            attempt === 0 &&
            user?.metadata?.creationTime &&
            user?.metadata?.lastSignInTime &&
            user.metadata.creationTime === user.metadata.lastSignInTime;

          if (isRecentSignUp) {
            await new Promise((resolve) => setTimeout(resolve, INITIAL_PROFILE_FETCH_DELAY));
          }

          const result = await getUserProfile(idToken, forceCache);

          if (result.success && result.profile) {
            setUserProfile(result.profile);
            setProfileLoading(false);
            return;
          }

          const normalizedError = result.error?.toLowerCase() ?? '';
          if (
            normalizedError.includes('usuário não encontrado') &&
            attempt < MAX_FETCH_PROFILE_RETRIES
          ) {
            shouldRetry = true;
            console.warn(
              `⚠️ Perfil ainda não disponível. Nova tentativa em ${FETCH_PROFILE_RETRY_DELAY}ms (${attempt + 2}/${MAX_FETCH_PROFILE_RETRIES + 1})`
            );
          } else {
            console.warn('Erro ao buscar perfil:', result.error);
            setUserProfile(null);
          }
        } catch (error) {
          if (attempt < MAX_FETCH_PROFILE_RETRIES) {
            shouldRetry = true;
            console.warn(
              `⚠️ Erro ao buscar perfil. Nova tentativa em ${FETCH_PROFILE_RETRY_DELAY}ms (${attempt + 2}/${MAX_FETCH_PROFILE_RETRIES + 1})`
            );
          } else {
            console.warn('Erro ao buscar perfil do usuário:', error);
            setUserProfile(null);
          }
        }

        if (shouldRetry) {
          setTimeout(() => {
            attemptFetch(attempt + 1);
          }, FETCH_PROFILE_RETRY_DELAY);
          return;
        }

        setProfileLoading(false);
      };

      await attemptFetch(0);
    },
    [idToken, user]
  );

  useEffect(() => {
    const loadSavedAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (savedToken) {
          setIdToken(savedToken);
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
      }
    };

    loadSavedAuth();
  }, []);

  useEffect(() => {
    console.log('🔐 Inicializando listener de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('👤 Estado de autenticação mudou:', currentUser ? 'Usuário logado' : 'Sem usuário');
      
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          }));
          
          console.log('✅ Token obtido e salvo com sucesso');
        } catch (error) {
          console.error('❌ Erro ao obter token:', error);
          setIdToken(null);
          await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        setIdToken(null);
        setUserProfile(null);
        
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        await clearUserProfileCache();
        
        console.log('🚪 Dados de autenticação limpos');
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🔌 Desconectando listener de autenticação');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (idToken && user) {
      const forceCache = Platform.OS !== 'web' ? false : false;
      fetchUserProfile(forceCache);
    }
  }, [idToken, user, fetchUserProfile]);

  const value: AuthContextType = {
    user,
    idToken,
    loading,
    isAuthenticated: !!user && !!idToken,
    userProfile,
    profileLoading,
    refreshToken,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 