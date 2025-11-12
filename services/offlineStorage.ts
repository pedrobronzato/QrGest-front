import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, MaintenanceData } from './equipment';

const STORAGE_KEYS = {
  EQUIPMENTS: '@qrgest:equipments',
  MAINTENANCE_QUEUE: '@qrgest:maintenance_queue',
  LAST_SYNC: '@qrgest:last_sync',
  USER_EQUIPMENTS: '@qrgest:user_equipments',
};

export const cacheEquipments = async (equipments: Equipment[]): Promise<boolean> => {
  try {
    console.log('💾 cacheEquipments INICIADO:', equipments.length, 'equipamentos');
    
    const data = {
      equipments,
      cachedAt: new Date().toISOString(),
    };
    
    const jsonString = JSON.stringify(data);
    console.log('💾 JSON gerado, tamanho:', jsonString.length, 'caracteres');
    
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENTS, jsonString);
    console.log('✅ AsyncStorage.setItem CONCLUÍDO');
    
    const verification = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENTS);
    if (verification) {
      const parsed = JSON.parse(verification);
      console.log('✅ VERIFICAÇÃO: Equipamentos salvos no cache:', parsed.equipments.length);
      return true;
    } else {
      console.error('❌ VERIFICAÇÃO FALHOU: Nada retornado do AsyncStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao salvar equipamentos no cache:', error);
    return false;
  }
};

export const getCachedEquipments = async (): Promise<{
  equipments: Equipment[];
  cachedAt: string | null;
} | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENTS);
    if (!data) {
      console.log('ℹ️ Nenhum equipamento no cache');
      return null;
    }

    const parsed = JSON.parse(data);
    console.log('✅ Equipamentos recuperados do cache:', parsed.equipments.length);
    return {
      equipments: parsed.equipments,
      cachedAt: parsed.cachedAt,
    };
  } catch (error) {
    console.error('❌ Erro ao recuperar equipamentos do cache:', error);
    return null;
  }
};

export const clearEquipmentsCache = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.EQUIPMENTS);
    console.log('🗑️ Cache de equipamentos limpo');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache de equipamentos:', error);
    return false;
  }
};

interface LocalAttachment {
  uri: string;
  type: 'image' | 'video';
  name: string;
}

export interface OfflineMaintenanceRecord extends MaintenanceData {
  tempId: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  retryCount?: number;
  localAttachments?: LocalAttachment[];
}

export const addMaintenanceToQueue = async (
  maintenance: MaintenanceData
): Promise<OfflineMaintenanceRecord> => {
  try {
    const queue = await getMaintenanceQueue();
    
    const offlineRecord: OfflineMaintenanceRecord = {
      ...maintenance,
      tempId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    queue.push(offlineRecord);
    await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_QUEUE, JSON.stringify(queue));
    
    console.log('✅ Manutenção adicionada à fila offline:', offlineRecord.tempId);
    return offlineRecord;
  } catch (error) {
    console.error('❌ Erro ao adicionar manutenção à fila:', error);
    throw error;
  }
};

export const getMaintenanceQueue = async (): Promise<OfflineMaintenanceRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_QUEUE);
    if (!data) {
      return [];
    }

    const queue = JSON.parse(data);
    console.log('ℹ️ Manutenções na fila:', queue.length);
    return queue;
  } catch (error) {
    console.error('❌ Erro ao recuperar fila de manutenção:', error);
    return [];
  }
};

export const removeFromMaintenanceQueue = async (tempId: string): Promise<boolean> => {
  try {
    const queue = await getMaintenanceQueue();
    const updatedQueue = queue.filter(item => item.tempId !== tempId);
    await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_QUEUE, JSON.stringify(updatedQueue));
    
    console.log('✅ Manutenção removida da fila:', tempId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover manutenção da fila:', error);
    return false;
  }
};

export const updateMaintenanceQueueStatus = async (
  tempId: string,
  status: 'pending' | 'syncing' | 'failed',
  incrementRetry: boolean = false
): Promise<boolean> => {
  try {
    const queue = await getMaintenanceQueue();
    const index = queue.findIndex(item => item.tempId === tempId);
    
    if (index === -1) {
      console.warn('⚠️ Manutenção não encontrada na fila:', tempId);
      return false;
    }

    queue[index].syncStatus = status;
    if (incrementRetry) {
      queue[index].retryCount = (queue[index].retryCount || 0) + 1;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_QUEUE, JSON.stringify(queue));
    console.log(`✅ Status atualizado para ${status}:`, tempId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar status da manutenção:', error);
    return false;
  }
};

export const clearMaintenanceQueue = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MAINTENANCE_QUEUE);
    console.log('🗑️ Fila de manutenções limpa');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar fila de manutenções:', error);
    return false;
  }
};

export const updateMaintenanceQueueWithAttachments = async (
  tempId: string,
  localAttachments: LocalAttachment[]
): Promise<void> => {
  try {
    const queue = await getMaintenanceQueue();
    const index = queue.findIndex(m => m.tempId === tempId);
    
    if (index !== -1) {
      queue[index].localAttachments = localAttachments;
      await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_QUEUE, JSON.stringify(queue));
      console.log(`✅ Anexos locais adicionados ao registro: ${tempId} (${localAttachments.length} anexos)`);
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar anexos locais:', error);
  }
};

export interface LastSyncInfo {
  timestamp: string;
  success: boolean;
  equipmentsCount?: number;
  syncedMaintenanceCount?: number;
}

export const saveLastSyncInfo = async (info: LastSyncInfo): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(info));
    console.log('✅ Info de sincronização salva:', info.timestamp);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar info de sincronização:', error);
    return false;
  }
};

export const getLastSyncInfo = async (): Promise<LastSyncInfo | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao recuperar info de sincronização:', error);
    return null;
  }
};

const USER_PROFILE_KEY = '@qrgest:user_profile';

export const cacheUserProfile = async (profile: any): Promise<boolean> => {
  try {
    const data = {
      profile,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
    console.log('✅ Perfil do usuário salvo no cache');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar perfil do usuário:', error);
    return false;
  }
};

export const getCachedUserProfile = async (): Promise<{
  profile: any;
  cachedAt: string | null;
} | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!data) {
      console.log('ℹ️ Nenhum perfil no cache');
      return null;
    }

    const parsed = JSON.parse(data);
    console.log('✅ Perfil do usuário recuperado do cache');
    return {
      profile: parsed.profile,
      cachedAt: parsed.cachedAt,
    };
  } catch (error) {
    console.error('❌ Erro ao recuperar perfil do usuário:', error);
    return null;
  }
};

export const clearUserProfileCache = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    console.log('🗑️ Cache de perfil limpo');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache de perfil:', error);
    return false;
  }
};

export const cacheUserEquipments = async (equipments: any[]): Promise<boolean> => {
  try {
    const data = {
      equipments,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_EQUIPMENTS, JSON.stringify(data));
    console.log('✅ Equipamentos do usuário salvos no cache:', equipments.length);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar equipamentos do usuário:', error);
    return false;
  }
};

export const getCachedUserEquipments = async (): Promise<{
  equipments: any[];
  cachedAt: string | null;
} | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_EQUIPMENTS);
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    console.log('✅ Equipamentos do usuário recuperados do cache:', parsed.equipments.length);
    return {
      equipments: parsed.equipments,
      cachedAt: parsed.cachedAt,
    };
  } catch (error) {
    console.error('❌ Erro ao recuperar equipamentos do usuário:', error);
    return null;
  }
};

export const getOfflineStats = async (): Promise<{
  cachedEquipments: number;
  pendingMaintenances: number;
  lastSync: string | null;
}> => {
  try {
    const equipments = await getCachedEquipments();
    const queue = await getMaintenanceQueue();
    const lastSync = await getLastSyncInfo();

    return {
      cachedEquipments: equipments?.equipments.length || 0,
      pendingMaintenances: queue.length,
      lastSync: lastSync?.timestamp || null,
    };
  } catch (error) {
    console.error('❌ Erro ao recuperar estatísticas:', error);
    return {
      cachedEquipments: 0,
      pendingMaintenances: 0,
      lastSync: null,
    };
  }
};

export const clearAllOfflineData = async (): Promise<boolean> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.EQUIPMENTS),
      AsyncStorage.removeItem(STORAGE_KEYS.MAINTENANCE_QUEUE),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_EQUIPMENTS),
      clearUserProfileCache(),
    ]);
    console.log('🗑️ Todos os dados offline foram limpos');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar dados offline:', error);
    return false;
  }
};

