import * as FileSystem from 'expo-file-system/legacy';
import { createMaintenanceRecord } from './equipment';
import { uploadImages } from './image';
import {
  getMaintenanceQueue,
  removeFromMaintenanceQueue,
  saveLastSyncInfo,
  updateMaintenanceQueueStatus
} from './offlineStorage';

type SyncResult = {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
};

let activeMaintenanceSync: Promise<SyncResult> | null = null;
const syncingMaintenanceIds = new Set<string>();

const executeMaintenanceSync = async (idToken: string): Promise<SyncResult> => {
  console.log('🔄 Iniciando sincronização de manutenções...');

  const queue = await getMaintenanceQueue();

  if (queue.length === 0) {
    console.log('ℹ️ Nenhuma manutenção pendente para sincronizar');
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  console.log(`📋 ${queue.length} manutenções na fila para sincronizar`);

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const maintenance of queue) {
    if (maintenance.syncStatus === 'syncing') {
      console.log(`⏭️ Pulando manutenção em sincronização: ${maintenance.tempId}`);
      continue;
    }

    if ((maintenance.retryCount || 0) >= 3) {
      console.log(`⏭️ Pulando manutenção com muitas tentativas: ${maintenance.tempId}`);
      failedCount++;
      continue;
    }

    if (syncingMaintenanceIds.has(maintenance.tempId)) {
      console.log(`⏭️ Manutenção ${maintenance.tempId} já está sendo processada em memória, ignorando duplicação`);
      continue;
    }

    syncingMaintenanceIds.add(maintenance.tempId);

    try {
      const statusUpdated = await updateMaintenanceQueueStatus(maintenance.tempId, 'syncing');

      if (!statusUpdated) {
        console.log(`⏭️ Manutenção já está sendo sincronizada em outro processo: ${maintenance.tempId}`);
        syncingMaintenanceIds.delete(maintenance.tempId);
        continue;
      }

      const { tempId, createdAt, syncStatus, retryCount, localAttachments, ...maintenanceData } = maintenance;

      let uploadedUrls: string[] = [];
      if (localAttachments && localAttachments.length > 0) {
        console.log(`📎 ${localAttachments.length} anexo(s) local(is) para upload`);

        const imageUris: string[] = [];
        const missingFiles: string[] = [];

        for (const attachment of localAttachments) {
          if (attachment.type === 'image') {
            try {
              const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
              if (fileInfo.exists) {
                imageUris.push(attachment.uri);
              } else {
                console.warn(`⚠️ Imagem não encontrada: ${attachment.uri}`);
                missingFiles.push(attachment.name);
              }
            } catch (error) {
              console.warn(`⚠️ Erro ao verificar imagem: ${attachment.uri}`, error);
              missingFiles.push(attachment.name);
            }
          }
        }

        if (imageUris.length > 0) {
          console.log(`📤 Fazendo upload de ${imageUris.length} imagem(ns)...`);
          try {
            const uploadResult = await uploadImages(imageUris, idToken);

            if (uploadResult.success && uploadResult.urls) {
              uploadedUrls = uploadResult.urls;
              console.log(`✅ Upload concluído: ${uploadedUrls.length} URL(s)`);
            } else {
              console.error(`❌ Erro no upload: ${uploadResult.error}`);
              errors.push(`Erro no upload de imagens: ${uploadResult.error}`);
            }
          } catch (uploadError: any) {
            console.error('❌ Erro inesperado no upload:', uploadError);
            errors.push(`Erro no upload: ${uploadError.message}`);
          }
        }

        if (missingFiles.length > 0) {
          console.warn(`⚠️ ${missingFiles.length} arquivo(s) não encontrado(s): ${missingFiles.join(', ')}`);
          maintenanceData.attachments = [
            ...uploadedUrls,
            ...localAttachments.map(att => att.uri)
          ];
        } else {
          maintenanceData.attachments = uploadedUrls;
        }
      }

      console.log(`📤 Enviando manutenção: ${tempId}`);
      console.log(`   - Equipamento: ${maintenanceData.equipmentId}`);
      console.log(`   - Título: ${maintenanceData.title}`);
      console.log(`   - Anexos: ${maintenanceData.attachments?.length || 0}`);

      const result = await createMaintenanceRecord(maintenanceData, idToken);

      if (result.success) {
        await removeFromMaintenanceQueue(tempId);
        syncedCount++;
        console.log(`✅ Manutenção sincronizada com sucesso: ${tempId}`);
      } else {
        await updateMaintenanceQueueStatus(tempId, 'failed', true);
        failedCount++;
        const errorMsg = result.error || 'Erro desconhecido';
        errors.push(errorMsg);
        console.log(`❌ Falha ao sincronizar ${tempId}: ${errorMsg}`);
      }
    } catch (error: any) {
      await updateMaintenanceQueueStatus(maintenance.tempId, 'failed', true);
      failedCount++;
      errors.push(error.message || 'Erro desconhecido');
      console.error(`❌ Erro ao sincronizar ${maintenance.tempId}:`, error);
    }
    finally {
      syncingMaintenanceIds.delete(maintenance.tempId);
    }
  }

  await saveLastSyncInfo({
    timestamp: new Date().toISOString(),
    success: failedCount === 0,
    syncedMaintenanceCount: syncedCount,
  });

  const allSuccess = failedCount === 0;
  console.log(
    allSuccess ? '✅' : '⚠️',
    `Sincronização completa: ${syncedCount} sucesso, ${failedCount} falhas`
  );

  return {
    success: allSuccess,
    syncedCount,
    failedCount,
    errors,
  };
};

export const syncPendingMaintenances = async (idToken: string): Promise<SyncResult> => {
  if (activeMaintenanceSync) {
    console.log('⏳ Sincronização de manutenções já em andamento, reutilizando chamada existente');
    return activeMaintenanceSync;
  }

  activeMaintenanceSync = executeMaintenanceSync(idToken);

  try {
    return await activeMaintenanceSync;
  } finally {
    activeMaintenanceSync = null;
  }
};

export const hasPendingSync = async (): Promise<boolean> => {
  const queue = await getMaintenanceQueue();
  return queue.length > 0;
};

export const getPendingSyncCount = async (): Promise<number> => {
  const queue = await getMaintenanceQueue();
  return queue.length;
};

export const autoSync = async (
  idToken: string,
  onProgress?: (status: string) => void
): Promise<boolean> => {
  try {
    const hasPending = await hasPendingSync();
    
    if (!hasPending) {
      onProgress?.('Nenhuma sincronização pendente');
      return true;
    }

    onProgress?.('Sincronizando dados...');
    const result = await syncPendingMaintenances(idToken);

    if (result.success) {
      onProgress?.(`✅ ${result.syncedCount} manutenções sincronizadas`);
      return true;
    } else {
      onProgress?.(
        `⚠️ ${result.syncedCount} sincronizadas, ${result.failedCount} falharam`
      );
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro na sincronização automática:', error);
    onProgress?.('❌ Erro na sincronização');
    return false;
  }
};

