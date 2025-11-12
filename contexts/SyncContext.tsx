import { useAuthContext } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { autoSync, getPendingSyncCount } from '@/services/syncService';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

interface SyncContextType {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  manualSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { isOnline } = useConnectivity();
  const { idToken, isAuthenticated } = useAuthContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const wasOfflineRef = useRef(false);
  const isSyncingRef = useRef(false);
  const PENDING_COUNT_INTERVAL = 30000;
  const PERIODIC_SYNC_INTERVAL = 300000;

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Erro ao atualizar contagem de pendentes:', error);
    }
  }, []);

  const manualSync = useCallback(async () => {
    if (!idToken || !isAuthenticated) {
      Alert.alert('Erro', 'Você precisa estar autenticado para sincronizar');
      return;
    }

    if (!isOnline) {
      Alert.alert('Sem Conexão', 'Você precisa estar online para sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      await autoSync(idToken, (status) => {
        console.log('Status de sincronização:', status);
      });
      
      setLastSyncTime(new Date());
      await refreshPendingCount();
      
      Alert.alert('Sucesso', 'Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      Alert.alert('Erro', 'Falha ao sincronizar dados');
    } finally {
      setIsSyncing(false);
    }
  }, [idToken, isAuthenticated, isOnline, refreshPendingCount]);

  useEffect(() => {
    console.log('📡 Estado de conexão mudou:', { 
      isOnline, 
      wasOffline: wasOfflineRef.current, 
      isAuthenticated, 
      hasToken: !!idToken,
      isSyncing: isSyncingRef.current
    });
    
    if (isOnline && wasOfflineRef.current && !isSyncingRef.current) {
      console.log('🌐 Voltou online! Verificando pendentes...');
      wasOfflineRef.current = false;
      
      getPendingSyncCount().then(count => {
        console.log(`📊 ${count} manutenções pendentes na fila`);
        
        if (count > 0 && isAuthenticated && idToken) {
          console.log('🔄 Iniciando sincronização automática...');
          
          setIsSyncing(true);
          isSyncingRef.current = true;
          
          autoSync(idToken, (status) => {
            console.log('📤', status);
          }).then(success => {
            if (success) {
              console.log('✅ Sincronização automática concluída com sucesso');
              setLastSyncTime(new Date());
              Alert.alert(
                'Sincronização Concluída',
                'Suas manutenções offline foram sincronizadas com sucesso!',
                [{ text: 'OK' }]
              );
            } else {
              console.log('⚠️ Sincronização automática concluída com algumas falhas');
              Alert.alert(
                'Sincronização Parcial',
                'Algumas manutenções não puderam ser sincronizadas. Tente novamente mais tarde.',
                [{ text: 'OK' }]
              );
            }
            refreshPendingCount();
          }).catch(error => {
            console.error('❌ Erro na sincronização automática:', error);
            Alert.alert(
              'Erro de Sincronização',
              'Não foi possível sincronizar suas manutenções. Tente manualmente mais tarde.',
              [{ text: 'OK' }]
            );
          }).finally(() => {
            setIsSyncing(false);
            isSyncingRef.current = false;
          });
        }
      });
    }
    
    if (!isOnline && !wasOfflineRef.current) {
      console.log('📴 Ficou offline');
      wasOfflineRef.current = true;
    }
  }, [isOnline, isAuthenticated, idToken]);

  const initSync = useCallback(async () => {
    console.log('🚀 Iniciando app - verificando sincronização...');
    await refreshPendingCount();
    if (isOnline && isAuthenticated && idToken) {
      const count = await getPendingSyncCount();
      console.log(`📊 Pendentes ao iniciar: ${count}`);
      if (count > 0) {
        console.log('🔄 Iniciando sincronização inicial...');
        setIsSyncing(true);
        isSyncingRef.current = true;
        try {
          const success = await autoSync(idToken, (status) => {
            console.log('📤', status);
          });
          if (success) {
            console.log('✅ Sincronização inicial concluída');
            setLastSyncTime(new Date());
          }
          await refreshPendingCount();
        } catch (error) {
          console.error('❌ Erro na sincronização inicial:', error);
        } finally {
          setIsSyncing(false);
          isSyncingRef.current = false;
        }
      } else {
        console.log('✅ Nenhuma manutenção pendente');
      }
    }
  }, [refreshPendingCount, isOnline, isAuthenticated, idToken]);

  useEffect(() => {
    initSync();
  }, [initSync]);

  useEffect(() => {
    const countInterval = setInterval(() => {
      refreshPendingCount();
    }, PENDING_COUNT_INTERVAL);
    
    const syncInterval = setInterval(async () => {
      if (isOnline && isAuthenticated && idToken && !isSyncingRef.current) {
        const count = await getPendingSyncCount();
        
        if (count > 0) {
          console.log(`⏰ Verificação periódica: ${count} pendentes - iniciando sync`);
          
          setIsSyncing(true);
          isSyncingRef.current = true;
          
          try {
            await autoSync(idToken, (status) => {
              console.log('📤 [Periódico]', status);
            });
            
            setLastSyncTime(new Date());
            await refreshPendingCount();
          } catch (error) {
            console.error('❌ Erro na sincronização periódica:', error);
          } finally {
            setIsSyncing(false);
            isSyncingRef.current = false;
          }
        }
      }
    }, PERIODIC_SYNC_INTERVAL);
    
    return () => {
      clearInterval(countInterval);
      clearInterval(syncInterval);
    };
  }, [isOnline, isAuthenticated, idToken]);

  const value: SyncContextType = {
    isSyncing,
    pendingCount,
    lastSyncTime,
    manualSync,
    refreshPendingCount,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSyncContext = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext deve ser usado dentro de um SyncProvider');
  }
  return context;
};

