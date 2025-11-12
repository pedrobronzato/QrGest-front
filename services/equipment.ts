import { apiUrl } from '@/config/apiUrl';
import axios from 'axios';
import {
  addMaintenanceToQueue,
  cacheEquipments,
  getCachedEquipments,
  OfflineMaintenanceRecord,
  saveLastSyncInfo
} from './offlineStorage';

export const api = axios.create({
  baseURL: apiUrl,
});

export interface EquipmentData {
  name: string;
  installationDate: string;
  type: string;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  selectedEquipment: string;
  specificFields: EquipmentSpecificFieldWithValue[];
}

export interface EquipmentSpecificFieldDefinition {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface AvailableEquipmentModel {
  id: string;
  name: string;
  specificFields: EquipmentSpecificFieldDefinition[];
}

export type AvailableEquipmentsDictionary = Record<string, AvailableEquipmentModel[]>;

export interface EquipmentSpecificFieldWithValue extends EquipmentSpecificFieldDefinition {
  value: string | number;
}

export interface Equipment {
  id: string;
  _id?: string;
  name: string;
  installationDate: string;
  type: string;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  selectedEquipment: string;
  specificFields?: EquipmentSpecificFieldWithValue[] | Record<string, string | number>;
  details?: EquipmentSpecificFieldWithValue[] | Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  __v?: number;
}

export const getAvailableEquipmentModels = async (
  idToken?: string
): Promise<{
  success: boolean;
  data?: AvailableEquipmentsDictionary;
  error?: string;
}> => {
  try {
    const response = await api.get(
      '/api/equipment/available-equipments',
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.response?.data?.error || 'Erro ao buscar modelos de equipamentos disponíveis',
    };
  }
};

export const registerEquipment = async (
  equipmentData: EquipmentData,
  idToken?: string 
): Promise<{ success: boolean; error?: string }> => {
  console.log(equipmentData, 'equipmentData');
  try {
    await api.post(
      '/api/equipment/register',
      equipmentData,
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    return { success: true };
  } catch (error: any) {
    console.log(error, 'error dentro do catch');
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao cadastrar equipamento',
    };
  }
};

export const getEquipments = async (
  idToken?: string,
  useCache: boolean = false
): Promise<{ 
  success: boolean; 
  data?: Equipment[]; 
  error?: string;
  fromCache?: boolean;
  cachedAt?: string | null;
}> => {
  if (useCache) {
    const cached = await getCachedEquipments();
    if (cached) {
      console.log('📦 Usando equipamentos do cache');
      return {
        success: true,
        data: cached.equipments,
        fromCache: true,
        cachedAt: cached.cachedAt,
      };
    }
  }

  try {
    console.log('🌐 Buscando equipamentos da API...');
    const response = await api.get(
      '/api/equipment/',
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    console.log(`✅ API retornou ${response.data.length} equipamentos`);
    
    console.log(`💾 INICIANDO salvamento de ${response.data.length} equipamentos no cache...`);
    const cacheSaved = await cacheEquipments(response.data);
    console.log(`💾 cacheEquipments retornou: ${cacheSaved ? 'TRUE ✅' : 'FALSE ❌'}`);
    
    if (cacheSaved) {
      console.log('📝 Salvando info de sincronização...');
      await saveLastSyncInfo({
        timestamp: new Date().toISOString(),
        success: true,
        equipmentsCount: response.data.length,
      });
      console.log('✅ Info de sincronização salva');
      
      console.log('🔍 Fazendo verificação final...');
      const verify = await getCachedEquipments();
      console.log(`🔍 VERIFICAÇÃO FINAL: ${verify?.equipments.length || 0} equipamentos em cache`);
    } else {
      console.error('❌ FALHA AO SALVAR NO CACHE!');
    }
    
    return { 
      success: true, 
      data: response.data,
      fromCache: false,
    };
  } catch (error: any) {
    console.log(error, 'error ao buscar equipamentos');
    
    const cached = await getCachedEquipments();
    if (cached) {
      console.log('📦 Usando cache como fallback após erro');
      return {
        success: true,
        data: cached.equipments,
        fromCache: true,
        cachedAt: cached.cachedAt,
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao buscar equipamentos',
    };
  }
};

export const getEquipmentById = async (
  equipmentId: string,
  idToken?: string,
  useCache: boolean = false
): Promise<{ 
  success: boolean; 
  data?: Equipment; 
  error?: string;
  fromCache?: boolean;
  debugInfo?: string;
}> => {
  console.log(`🔍 getEquipmentById chamado: id=${equipmentId}, useCache=${useCache}`);
  
  let debugComparisonInfo = '';
  
  if (useCache) {
    const cached = await getCachedEquipments();
    if (cached) {
      console.log(`📦 Cache disponível com ${cached.equipments.length} equipamentos`);
      
      const comparisonDetails: string[] = [];
      comparisonDetails.push(`Buscando: "${equipmentId}" (tipo: ${typeof equipmentId}, length: ${equipmentId?.length})\n\n`);
      comparisonDetails.push(`Equipamentos no cache:\n`);
      
      cached.equipments.forEach((e: any, index: number) => {
        const eqId = e.id;
        const eqMongoId = e._id;
        comparisonDetails.push(
          `\n[${index}] ${e.name}\n` +
          `  id: "${eqId}" (tipo: ${typeof eqId}${eqId ? `, len: ${eqId.length}` : ''})\n` +
          `  _id: "${eqMongoId}" (tipo: ${typeof eqMongoId}${eqMongoId ? `, len: ${eqMongoId.length}` : ''})\n` +
          `  id match? ${eqId === equipmentId}\n` +
          `  _id match? ${eqMongoId === equipmentId}`
        );
      });
      
      debugComparisonInfo = comparisonDetails.join('');
      console.log('🔍 DEBUG COMPARAÇÃO:\n', debugComparisonInfo);
      
      const equipment = cached.equipments.find(
        e => {
          const eqId = (e as any).id;
          const eqMongoId = (e as any)._id;
          const matches = eqId === equipmentId || eqMongoId === equipmentId;
          
          if (matches) {
            console.log(`✅ Match encontrado: ${eqId || eqMongoId} === ${equipmentId}`);
          }
          
          return matches;
        }
      );
      
      if (equipment) {
        console.log('📦 Usando equipamento do cache:', equipment.name);
        return {
          success: true,
          data: equipment,
          fromCache: true,
        };
      } else {
        console.log(`⚠️ Equipamento ${equipmentId} não encontrado no cache`);
      }
    } else {
      console.log('⚠️ Nenhum cache disponível');
      debugComparisonInfo = 'Nenhum cache disponível';
    }
  }

  try {
    console.log('🌐 Tentando buscar da API...');
    const response = await api.get(
      `/api/equipment/${equipmentId}`,
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    console.log('✅ Equipamento obtido da API');
    return { success: true, data: response.data, fromCache: false };
  } catch (error: any) {
    console.log('❌ Erro ao buscar da API:', error.message);
    
    console.log('🔄 Tentando cache como fallback...');
    const cached = await getCachedEquipments();
    if (cached) {
      console.log(`📦 Cache disponível com ${cached.equipments.length} equipamentos (fallback)`);
      
      const equipment = cached.equipments.find(
        e => {
          const eqId = (e as any).id;
          const eqMongoId = (e as any)._id;
          return eqId === equipmentId || eqMongoId === equipmentId;
        }
      );
      
      if (equipment) {
        console.log('✅ Usando cache como fallback após erro:', equipment.name);
        return {
          success: true,
          data: equipment,
          fromCache: true,
        };
      } else {
        console.log(`❌ Equipamento ${equipmentId} não encontrado no cache (fallback)`);
      }
    } else {
      console.log('❌ Nenhum cache disponível para fallback');
    }

    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao buscar equipamento',
      debugInfo: debugComparisonInfo,
    };
  }
};

export interface MaintenanceRecord {
  id?: string;
  _id?: string;
  equipmentId: {
    _id: string;
    name: string;
    type: string;
    status: string;
    location?: {
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  title?: string;
  reviewDate: string;
  maintenanceDate?: string;
  technicianInfo?: {
    _id?: string ;
    name: string;
    email: string;
  };
  statusAfterReview: 'active' | 'maintenance_pending' | 'inactive';
  serviceDescription: string;
  partsReplaced: string;
  nextMaintenanceDate: string;
  attachments?: string[];
  syncStatus?: 'synced' | 'pending' | 'offline';
  createdAt: string;
  updatedAt: string;
  technicianId?: string;
  createdBy?: string;
  __v?: number;
}

export interface MaintenanceData {
  equipmentId: string;
  title: string;
  reviewDate: string;
  statusAfterReview: 'active' | 'maintenance_pending' | 'inactive';
  serviceDescription: string;
  partsReplaced: string;
  nextMaintenanceDate: string;
  attachments?: string[];
}

export const createMaintenanceRecord = async (
  maintenanceData: MaintenanceData,
  idToken?: string,
  isOffline: boolean = false
): Promise<{ 
  success: boolean; 
  error?: string;
  offlineRecord?: OfflineMaintenanceRecord;
}> => {
  if (isOffline) {
    try {
      const offlineRecord = await addMaintenanceToQueue(maintenanceData);
      console.log('📴 Manutenção salva para sincronização posterior');
      return { 
        success: true,
        offlineRecord,
      };
    } catch {
      return {
        success: false,
        error: 'Erro ao salvar manutenção offline',
      };
    }
  }

  try {
    await api.post(
      '/api/maintenance/',
      maintenanceData,
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    return { success: true };
  } catch (error: any) {
    console.log('⚠️ Erro ao enviar online, salvando offline');
    try {
      const offlineRecord = await addMaintenanceToQueue(maintenanceData);
      return {
        success: true,
        offlineRecord,
      };
    } catch {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar registro de manutenção',
      };
    }
  }
};

export const getMaintenanceHistory = async (
  equipmentId: string,
  idToken?: string
): Promise<{ success: boolean; data?: MaintenanceRecord[]; error?: string }> => {
  try {
    const response = await api.get(
      `/api/maintenance/equipment/${equipmentId}`,
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao buscar histórico de manutenção',
    };
  }
};

export const getAllMaintenanceRecords = async (
  idToken?: string
): Promise<{ success: boolean; data?: MaintenanceRecord[]; error?: string }> => {
  try {
    const response = await api.get(
      '/api/maintenance/',
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );

    console.log(JSON.stringify(response.data), 'response.data');
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao buscar registros de manutenção',
    };
  }
};

export const getMaintenanceRecordById = async (
  recordId: string,
  idToken?: string
): Promise<{ success: boolean; data?: MaintenanceRecord; error?: string }> => {
  try {
    const response = await api.get(
      `/api/maintenance/${recordId}`,
      idToken
        ? {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        : undefined
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.log(error, 'error ao buscar registro de manutenção');
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao buscar registro de manutenção',
    };
  }
}; 