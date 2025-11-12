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

  const fetchUserProfile = React.useCallback(async (forceCache: boolean = false) => {
    if (!idToken) return;
    
    setProfileLoading(true);
    try {
      const result = await getUserProfile(idToken, forceCache);
      console.log(result, 'result');
      
      if (result.success && result.profile) {
        setUserProfile(result.profile);
        
        if (result.fromCache) {
          console.log('👤 Perfil carregado do cache');
        }
        
        if (result.profile.role === 'tecnico' && result.profile.equipments && result.profile.equipments.length > 0 && !result.fromCache) {
          console.log(`💾 [AuthContext] Salvando ${result.profile.equipments.length} equipamentos do técnico no cache...`);
          const { cacheEquipments } = await import('@/services/offlineStorage');
          const saved = await cacheEquipments(result.profile.equipments as any);
          console.log(`💾 [AuthContext] Equipamentos do técnico no cache: ${saved ? 'SIM ✅' : 'NÃO ❌'}`);
        }
      } else {
        console.error('Erro ao buscar perfil:', result.error);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [idToken]);

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