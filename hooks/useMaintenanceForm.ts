import { MaintenanceData, MaintenanceRecord } from '@/services/equipment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useConnectivity } from './useConnectivity';

interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'video';
  name: string;
}

interface UseMaintenanceFormProps {
  equipmentId: string;
  onSyncStatusChange: (status: 'synced' | 'pending' | 'offline') => void;
}

const formatDateToISO = (dateString: string): string => {
  if (!dateString || dateString.length !== 10) return new Date().toISOString().split('T')[0];
  
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return new Date().toISOString().split('T')[0];
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString().split('T')[0];
};

const formatDateToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '';
  
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}/${month}/${year}`;
};

export const useMaintenanceForm = ({ equipmentId, onSyncStatusChange }: UseMaintenanceFormProps) => {
  const [formData, setFormData] = useState<MaintenanceData>({
    equipmentId,
    title: '',
    reviewDate: formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]),
    statusAfterReview: 'active',
    serviceDescription: '',
    partsReplaced: '',
    nextMaintenanceDate: formatDateToDDMMYYYY(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    attachments: []
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { isOnline } = useConnectivity();
  const [pendingRecords, setPendingRecords] = useState<MaintenanceRecord[]>([]);

  useEffect(() => {
    loadOfflineData();
  }, [equipmentId]);

  const loadOfflineData = async () => {
    try {
      const offlineData = await AsyncStorage.getItem(`maintenance_${equipmentId}`);
      if (offlineData) {
        const parsed = JSON.parse(offlineData);
        const convertedFormData = {
          ...parsed.formData,
          reviewDate: parsed.formData.reviewDate.includes('/') 
            ? parsed.formData.reviewDate 
            : formatDateToDDMMYYYY(parsed.formData.reviewDate),
          nextMaintenanceDate: parsed.formData.nextMaintenanceDate.includes('/')
            ? parsed.formData.nextMaintenanceDate
            : formatDateToDDMMYYYY(parsed.formData.nextMaintenanceDate)
        };
        setFormData(convertedFormData);
        setAttachments(parsed.attachments || []);
      }

      const pending = await AsyncStorage.getItem(`pending_maintenance_${equipmentId}`);
      if (pending) {
        setPendingRecords(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
    }
  };

  const saveOffline = async () => {
    try {
      const offlineData = {
        formData,
        attachments,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(`maintenance_${equipmentId}`, JSON.stringify(offlineData));
      onSyncStatusChange('offline');
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar offline:', error);
      return { success: false, error: 'Erro ao salvar offline' };
    }
  };

  const addAttachment = (uri: string, type: 'image' | 'video') => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      uri,
      type,
      name: `attachment_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`
    };
    
    setAttachments(prev => [...prev, newAttachment]);
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAttachment.uri]
    }));
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(uri => 
        !attachments.find(att => att.id === id && att.uri === uri)
      ) || []
    }));
  };

  const updateFormData = (updates: Partial<MaintenanceData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const clearForm = () => {
    setFormData({
      equipmentId,
      title: '',
      reviewDate: formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]),
      statusAfterReview: 'active',
      serviceDescription: '',
      partsReplaced: '',
      nextMaintenanceDate: formatDateToDDMMYYYY(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      attachments: []
    });
    setAttachments([]);
  };

  const addPendingRecord = async (record: MaintenanceRecord) => {
    try {
      const newPending = [...pendingRecords, record];
      setPendingRecords(newPending);
      await AsyncStorage.setItem(`pending_maintenance_${equipmentId}`, JSON.stringify(newPending));
    } catch (error) {
      console.error('Erro ao adicionar registro pendente:', error);
    }
  };

  const removePendingRecord = async (id: string) => {
    try {
      const newPending = pendingRecords.filter(record => record.id !== id);
      setPendingRecords(newPending);
      await AsyncStorage.setItem(`pending_maintenance_${equipmentId}`, JSON.stringify(newPending));
    } catch (error) {
      console.error('Erro ao remover registro pendente:', error);
    }
  };

  const getFormDataForSubmission = () => {
    const trimmedServiceDescription = formData.serviceDescription?.trim() ?? '';
    const trimmedPartsReplaced = formData.partsReplaced?.trim() ?? '';

    return {
      ...formData,
      serviceDescription: trimmedServiceDescription,
      partsReplaced: trimmedPartsReplaced,
      reviewDate: formatDateToISO(formData.reviewDate),
      nextMaintenanceDate: formatDateToISO(formData.nextMaintenanceDate),
    };
  };

  return {
    formData,
    attachments,
    isOnline,
    pendingRecords,
    updateFormData,
    addAttachment,
    removeAttachment,
    saveOffline,
    clearForm,
    addPendingRecord,
    removePendingRecord,
    getFormDataForSubmission
  };
};
