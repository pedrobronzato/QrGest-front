
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  Icon,
  InfoIcon,
  ShareIcon
} from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaintenanceForm } from '@/hooks/useMaintenanceForm';
import { Equipment, MaintenanceRecord, createMaintenanceRecord, getEquipmentById, getMaintenanceHistory } from '@/services/equipment';
import { uploadImages } from '@/services/image';
import { getEquipmentStatusOptions, resolveEquipmentStatus, resolveEquipmentType } from '@/utils/equipment';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;
const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const SECONDARY_GRADIENT_COLORS = ['#64748B', '#94A3B8'] as const;

const validateMediaFormat = (mimeType: string, fileSize: number): { isValid: boolean; error?: string } => {
  const sizeInMB = fileSize / (1024 * 1024);
  
  if (ACCEPTED_IMAGE_FORMATS.includes(mimeType)) {
    if (sizeInMB > MAX_IMAGE_SIZE_MB) {
      return { 
        isValid: false, 
        error: `Imagem muito grande. Tamanho máximo: ${MAX_IMAGE_SIZE_MB}MB` 
      };
    }
    return { isValid: true };
  }
  
  if (ACCEPTED_VIDEO_FORMATS.includes(mimeType)) {
    if (sizeInMB > MAX_VIDEO_SIZE_MB) {
      return { 
        isValid: false, 
        error: `Vídeo muito grande. Tamanho máximo: ${MAX_VIDEO_SIZE_MB}MB` 
      };
    }
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    error: `Formato não suportado. Use: ${ACCEPTED_IMAGE_FORMATS.join(', ')} para imagens ou ${ACCEPTED_VIDEO_FORMATS.join(', ')} para vídeos` 
  };
};

const convertImageToCompatibleFormat = async (uri: string): Promise<string> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error('Arquivo não encontrado');
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Erro ao converter imagem:', error);
    return uri;
  }
};

const getFileInfo = async (uri: string): Promise<{ mimeType: string; size: number; name: string }> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error('Arquivo não encontrado');
    
    const fileName = uri.split('/').pop() || 'unknown';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    let mimeType = 'application/octet-stream';
    if (['jpg', 'jpeg'].includes(extension)) mimeType = 'image/jpeg';
    else if (extension === 'png') mimeType = 'image/png';
    else if (extension === 'mp4') mimeType = 'video/mp4';
    else if (extension === 'mov') mimeType = 'video/quicktime';
    
    return {
      mimeType,
      size: fileInfo.size || 0,
      name: fileName
    };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    return {
      mimeType: 'application/octet-stream',
      size: 0,
      name: 'unknown'
    };
  }
};

interface SelectOption {
  id: string;
  name: string;
}

interface CustomSelectProps {
  placeholder: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  isInvalid?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  placeholder,
  options,
  selectedValue,
  onValueChange,
  isInvalid = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.id === selectedValue);
  
  return (
    <>
      <Pressable onPress={() => setIsModalVisible(true)}>
        <Box className={`border rounded px-3 py-3 flex-row items-center justify-between ${
          isInvalid ? 'border-red-500' : 'border-gray-300'
        }`}>
          <Text className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
          <Icon as={ChevronDownIcon} className="text-gray-400 w-5 h-5" />
        </Box>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <Box className="flex-1 justify-end">
            <TouchableOpacity activeOpacity={1}>
              <Box className="bg-white rounded-t-lg">
                <Box className="p-4 border-b border-gray-200">
                  <Text className="text-lg font-semibold text-center">
                    Selecionar Opção
                  </Text>
                </Box>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onValueChange(item.id);
                        setIsModalVisible(false);
                      }}
                    >
                      <Box className={`p-4 border-b border-gray-100 ${
                        selectedValue === item.id ? 'bg-blue-50' : ''
                      }`}>
                        <Text className={`text-base ${
                          selectedValue === item.id ? 'text-blue-600 font-medium' : 'text-gray-900'
                        }`}>
                          {item.name}
                        </Text>
                      </Box>
                    </TouchableOpacity>
                  )}
                />
                <Box className="p-4">
                  <Button
                    variant="outline"
                    onPress={() => setIsModalVisible(false)}
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                </Box>
              </Box>
            </TouchableOpacity>
          </Box>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

interface DateInputProps {
  value: string;
  onValueChange: (date: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onValueChange,
  placeholder = "DD/MM/AAAA",
  isInvalid = false,
  onFocus,
  onBlur,
}) => {
  const formatDate = (numbers: string) => {
    let formatted = numbers;
    
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
    }
    
    if (numbers.length >= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
    }
    
    return formatted;
  };

  const handleChangeText = (text: string) => {
    if (text.length < value.length && value.endsWith('/')) {
      const numbersOnly = value.replace(/\D/g, '');
      const newNumbers = numbersOnly.slice(0, -1);
      const formatted = formatDate(newNumbers);
      onValueChange(formatted);
      return;
    }
    
    const numbers = text.replace(/\D/g, '');
    const formatted = formatDate(numbers);
    onValueChange(formatted);
  };

  return (
    <Input>
      <InputField
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        maxLength={10}
        returnKeyType="next"
        blurOnSubmit={false}
        onFocus={() => {
          onFocus?.();
        }}
        onBlur={() => {
          onBlur?.();
        }}
      />
    </Input>
  );
};

const maintenanceStatusOptions = getEquipmentStatusOptions(['active', 'maintenance_pending', 'inactive']);

export default function EquipmentMaintenanceScreen() {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('offline');
  const [fileDetails, setFileDetails] = useState<Record<string, { size: number; mimeType: string }>>({});

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const focusedInputCount = useRef(0);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  
  const { idToken } = useAuthContext();
  const { id, fromCache } = useLocalSearchParams<{ id: string; fromCache?: string }>();
  const [pendingCount, setPendingCount] = useState(0);
  
  const refreshPendingCount = async () => {
    try {
      const { getMaintenanceQueue } = await import('@/services/offlineStorage');
      const queue = await getMaintenanceQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Erro ao atualizar contagem:', error);
    }
  };
  const isFromCache = fromCache === 'true';
  
  
  const {
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
  } = useMaintenanceForm({
    equipmentId: id || '',
    onSyncStatusChange: setSyncStatus
  });

  const loadEquipment = async () => {
    if (!id) {
      Alert.alert('Erro', 'ID do equipamento não fornecido');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const useCache = isFromCache || !isOnline;
      
      const result = await getEquipmentById(id, idToken || undefined, useCache);
      
      if (result.success && result.data) {
        setEquipment(result.data);
        updateFormData({
          equipmentId: result.data!._id || result.data!.id
        });
        
        if (result.fromCache) {
          console.log('📦 Equipamento carregado do cache para manutenção');
        } else {
          console.log('🌐 Equipamento carregado da API');
        }
      } else {
        console.error('❌ Erro ao carregar equipamento:', result.error);
        
        if (!useCache) {
          console.log('🔄 Tentando carregar do cache como fallback...');
          const cacheResult = await getEquipmentById(id, idToken || undefined, true);
          
          if (cacheResult.success && cacheResult.data) {
            setEquipment(cacheResult.data);
            updateFormData({
              equipmentId: cacheResult.data!._id || cacheResult.data!.id
            });
            console.log('✅ Equipamento recuperado do cache após falha');
            return;
          }
        }
        
        Alert.alert(
          'Erro ao Carregar', 
          `Não foi possível carregar o equipamento. ${!isOnline ? 'Verifique se o equipamento está no cache.' : result.error || 'Tente novamente.'}`,
          [
            { text: 'Voltar', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erro ao carregar equipamento:', error);
      Alert.alert('Erro', 'Erro ao carregar equipamento. Tente novamente.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceHistory = async () => {
    if (!id) return;
    
    try {
      const result = await getMaintenanceHistory(id, idToken || undefined);
      if (result.success && result.data) {
        setMaintenanceHistory(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadMaintenanceHistory();
    refreshPendingCount();
  }, [id]);

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'synced':
        return 'Sincronizado';
      case 'pending':
        return 'Aguardando Envio';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputFocus = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    focusedInputCount.current += 1;
    if (!isHeaderCollapsed) {
      setIsHeaderCollapsed(true);
    }
  };

  const handleInputBlur = () => {
    focusedInputCount.current = Math.max(0, focusedInputCount.current - 1);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      if (focusedInputCount.current === 0) {
        setIsHeaderCollapsed(false);
      }
    }, 150);
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    focusedInputCount.current = 0;
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHeaderCollapsed(false);
  };

  const handleSaveOffline = async () => {
    try {
      if (!formData.title || !formData.reviewDate) {
        Alert.alert('Campos Obrigatórios', 'Por favor, preencha o título e a data de revisão.');
        return;
      }

      if (attachments.length > 0) {
        const attachmentValidation = await validateAllAttachments();
        if (!attachmentValidation.isValid) {
          const errorMessage = `Os seguintes anexos não são compatíveis:\n\n${attachmentValidation.errors.join('\n')}\n\nPor favor, remova ou substitua os anexos problemáticos.`;
          Alert.alert('Anexos Incompatíveis', errorMessage);
          return;
        }
      }

      setSending(true);
      console.log('💾 Salvando manutenção offline...');

      const submissionData = getFormDataForSubmission();
      
      const localAttachments = attachments.map(att => ({
        uri: att.uri,
        type: att.type,
        name: att.name
      }));

      const maintenanceData = {
        equipmentId: formData.equipmentId,
        title: formData.title,
        reviewDate: submissionData.reviewDate,
        statusAfterReview: formData.statusAfterReview,
        serviceDescription: formData.serviceDescription,
        partsReplaced: formData.partsReplaced,
        nextMaintenanceDate: submissionData.nextMaintenanceDate,
        attachments: [],
      };

      const { addMaintenanceToQueue } = await import('@/services/offlineStorage');
      const offlineRecord = await addMaintenanceToQueue(maintenanceData);
      
      if (localAttachments.length > 0) {
        offlineRecord.localAttachments = localAttachments;
        const { updateMaintenanceQueueWithAttachments } = await import('@/services/offlineStorage');
        await updateMaintenanceQueueWithAttachments(offlineRecord.tempId, localAttachments);
      }

      console.log('✅ Manutenção adicionada à fila:', offlineRecord.tempId);
      console.log(`📎 ${localAttachments.length} anexo(s) local(is) salvos para sincronização`);

      await saveOffline();

      setSyncStatus('pending');
      setSending(false);
      await refreshPendingCount();

      Alert.alert(
        '✅ Salvo com Sucesso',
        'A manutenção foi salva offline e será sincronizada automaticamente quando houver conexão com a internet.',
        [
          {
            text: 'Ver Pendentes',
            onPress: () => {
              showPendingSyncInfo();
            }
          },
          {
            text: 'OK',
            onPress: () => {
              clearForm();
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erro ao salvar offline:', error);
      setSending(false);
      Alert.alert('Erro', 'Não foi possível salvar a manutenção offline. Tente novamente.');
    }
  };

  const showPendingSyncInfo = async () => {
    try {
      const { getMaintenanceQueue } = await import('@/services/offlineStorage');
      const queue = await getMaintenanceQueue();
      
      const pendingCount = queue.filter(r => r.syncStatus === 'pending').length;
      const failedCount = queue.filter(r => r.syncStatus === 'failed').length;
      
      const message = `
📊 Status de Sincronização:

• Pendentes: ${pendingCount}
• Falhadas: ${failedCount}
• Total na fila: ${queue.length}

${isOnline 
  ? '✅ Você está online. As manutenções serão sincronizadas em breve.' 
  : '📴 Você está offline. As manutenções serão sincronizadas quando voltar online.'
}
      `.trim();
      
      Alert.alert('Sincronização Pendente', message);
    } catch (error) {
      console.error('Erro ao verificar fila:', error);
    }
  };

  const handleSend = async () => {
    try {
      console.log('Iniciando envio...');
      setSending(true);
      setUploadStatus('Validando dados...');
      console.log('Estado sending definido como true');
      
      if (attachments.length > 0) {
        setUploadStatus('Validando anexos...');
        const attachmentValidation = await validateAllAttachments();
        if (!attachmentValidation.isValid) {
          const errorMessage = `Os seguintes anexos não são compatíveis:\n\n${attachmentValidation.errors.join('\n')}\n\nPor favor, remova ou substitua os anexos problemáticos antes de enviar.`;
          Alert.alert('Anexos Incompatíveis', errorMessage);
          setSending(false);
          setUploadStatus('');
          console.log('Validação de anexos falhou, sending definido como false');
          return;
        }
      }
      
      setSyncStatus('pending');
      
      let uploadedUrls: string[] = [];
      if (attachments.length > 0) {
        const imageUris = attachments
          .filter(attachment => attachment.type === 'image')
          .map(attachment => attachment.uri);
        
        if (imageUris.length > 0) {
          console.log('Fazendo upload de', imageUris.length, 'imagens...');
          setUploadStatus(`Fazendo upload de ${imageUris.length} ${imageUris.length === 1 ? 'imagem' : 'imagens'}...`);
          
          const uploadResult = await uploadImages(imageUris, idToken || undefined);
          
          if (uploadResult.success && uploadResult.urls) {
            uploadedUrls = uploadResult.urls;
            console.log('Upload realizado com sucesso:', uploadedUrls);
            setUploadStatus('Upload concluído! Enviando dados...');
          } else {
            console.error('Erro no upload das imagens:', uploadResult.error);
            Alert.alert('Erro', 'Falha no upload das imagens. Tente novamente.');
            setSyncStatus('offline');
            setSending(false);
            setUploadStatus('');
            console.log('Erro no upload, sending definido como false');
            return;
          }
        }
      } else {
        setUploadStatus('Enviando dados...');
      }
      
      const submissionData = getFormDataForSubmission();
      if (uploadedUrls.length > 0) {
        submissionData.attachments = uploadedUrls;
      }
      
      console.log(submissionData, 'data');
      const result = await createMaintenanceRecord(submissionData, idToken || undefined);
      
      if (result.success) {
        setSyncStatus('synced');
        setUploadStatus('');
        Alert.alert('Sucesso', 'Registro de manutenção enviado com sucesso');
        clearForm();
        setSending(false);
        console.log('Sucesso no envio, sending definido como false');
        router.back();
      } else {
        const pendingRecord: MaintenanceRecord = {
          id: Date.now().toString(),
          equipmentId: {
            _id: formData.equipmentId,
            name: formData.equipmentId,
            type: formData.equipmentId,
            status: formData.equipmentId,
          },
          title: formData.title,
          reviewDate: submissionData.reviewDate,
          statusAfterReview: formData.statusAfterReview,
          serviceDescription: formData.serviceDescription,
          partsReplaced: formData.partsReplaced,
          nextMaintenanceDate: submissionData.nextMaintenanceDate,
          attachments: formData.attachments,
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await addPendingRecord(pendingRecord);
        setSyncStatus('pending');
        setSending(false);
        setUploadStatus('');
        console.log('Registro salvo como pendente, sending definido como false');
        Alert.alert('Aviso', 'Registro salvo como pendente. Será enviado quando houver conexão.');
      }
    } catch (error) {
      const submissionData = getFormDataForSubmission();
      const offlineRecord: MaintenanceRecord = {
        id: Date.now().toString(),
        equipmentId: {
          _id: formData.equipmentId,
          name: formData.equipmentId,
          type: formData.equipmentId,
          status: formData.equipmentId,
        },
        title: formData.title,
        reviewDate: submissionData.reviewDate,
        statusAfterReview: formData.statusAfterReview,
        serviceDescription: formData.serviceDescription,
        partsReplaced: formData.partsReplaced,
        nextMaintenanceDate: submissionData.nextMaintenanceDate,
        attachments: formData.attachments,
        syncStatus: 'offline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addPendingRecord(offlineRecord);
      setSyncStatus('offline');
      setSending(false);
      setUploadStatus('');
      console.log('Erro no envio, sending definido como false');
      Alert.alert('Erro', 'Erro ao enviar registro. Salvo offline.');
    }
    console.log('Função handleSend finalizada');
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permissões Necessárias',
          'Precisamos de permissão para acessar a câmera e galeria para adicionar anexos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const showMediaOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handleChooseFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Adicionar Mídia',
        'Escolha uma opção:',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tirar Foto', onPress: handleTakePhoto },
          { text: 'Escolher da Galeria', onPress: handleChooseFromGallery },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const fileInfo = await getFileInfo(asset.uri);
        
        const validation = validateMediaFormat(fileInfo.mimeType, fileInfo.size);
        if (!validation.isValid) {
          Alert.alert('Formato não suportado', validation.error);
          return;
        }
        
        let finalUri = asset.uri;
        if (asset.type === 'image' && fileInfo.mimeType !== 'image/jpeg') {
          try {
            finalUri = await convertImageToCompatibleFormat(asset.uri);
            Alert.alert('Conversão', 'Imagem convertida para formato JPEG compatível');
          } catch (error) {
            console.error('Erro na conversão:', error);
            Alert.alert('Aviso', 'Não foi possível converter a imagem, mas será enviada no formato original');
          }
        }
        
        const type = asset.type === 'video' ? 'video' : 'image';
        addAttachment(finalUri, type);
        
        setFileDetails(prev => ({
          ...prev,
          [finalUri]: {
            size: fileInfo.size,
            mimeType: fileInfo.mimeType
          }
        }));
        
        Alert.alert('Sucesso', `${type === 'image' ? 'Foto' : 'Vídeo'} adicionado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao capturar mídia:', error);
      Alert.alert('Erro', 'Erro ao capturar mídia. Tente novamente.');
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let processedCount = 0;
        let errorCount = 0;
        
        for (const asset of result.assets) {
          try {
            const fileInfo = await getFileInfo(asset.uri);
            
            const validation = validateMediaFormat(fileInfo.mimeType, fileInfo.size);
            if (!validation.isValid) {
              console.warn(`Arquivo rejeitado: ${fileInfo.name} - ${validation.error}`);
              errorCount++;
              continue;
            }
            
            let finalUri = asset.uri;
            if (asset.type === 'image' && fileInfo.mimeType !== 'image/jpeg') {
              try {
                finalUri = await convertImageToCompatibleFormat(asset.uri);
                console.log(`Imagem convertida: ${fileInfo.name}`);
              } catch (error) {
                console.error('Erro na conversão:', error);
              }
            }
            
            const type = asset.type === 'video' ? 'video' : 'image';
            addAttachment(finalUri, type);
            
            setFileDetails(prev => ({
              ...prev,
              [finalUri]: {
                size: fileInfo.size,
                mimeType: fileInfo.mimeType
              }
            }));
            
            processedCount++;
          } catch (error) {
            console.error(`Erro ao processar arquivo:`, error);
            errorCount++;
          }
        }
        
        let message = `${processedCount} arquivo(s) adicionado(s) com sucesso!`;
        if (errorCount > 0) {
          message += `\n${errorCount} arquivo(s) não puderam ser processados.`;
        }
        
        Alert.alert('Resultado', message);
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
      Alert.alert('Erro', 'Erro ao selecionar mídia. Tente novamente.');
    }
  };

  const handleAddAttachment = (type: 'image' | 'video') => {
    showMediaOptions();
  };

  const showFormatInfo = () => {
    Alert.alert(
      'Formatos Aceitos',
      `📸 Imagens: JPG, JPEG, PNG (máx. ${MAX_IMAGE_SIZE_MB}MB)\n` +
      `🎥 Vídeos: MP4, MOV (máx. ${MAX_VIDEO_SIZE_MB}MB)\n\n` +
      `💡 Dica: Imagens PNG serão automaticamente convertidas para JPEG para melhor compatibilidade com o servidor.`,
      [{ text: 'Entendi', style: 'default' }]
    );
  };

  const validateAllAttachments = async (): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];
    
    for (const attachment of attachments) {
      try {
        const fileInfo = await getFileInfo(attachment.uri);
        const validation = validateMediaFormat(fileInfo.mimeType, fileInfo.size);
        
        if (!validation.isValid) {
          errors.push(`${fileInfo.name}: ${validation.error}`);
        }
      } catch (error) {
        errors.push(`${attachment.name}: Erro ao validar arquivo`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRemoveAttachment = (id: string, uri: string) => {
    removeAttachment(id);
    setFileDetails(prev => {
      const newDetails = { ...prev };
      delete newDetails[uri];
      return newDetails;
    });
  };


  const renderDetailItem = (label: string, value: string | number | undefined, icon?: any) => (
    <HStack className="justify-between items-center py-3 border-b border-gray-100">
      <HStack className="items-center" space="sm">
        {icon && <Icon as={icon} className="text-gray-400" />}
        <Text className="text-gray-600 font-medium">{label}</Text>
      </HStack>
      <Text className="text-gray-800 font-semibold">
        {value !== undefined ? value.toString() : 'N/A'}
      </Text>
    </HStack>
  );

  const renderDetailSection = (title: string, children: React.ReactNode) => (
    <VStack className="bg-white rounded-lg p-4 mb-4" space="sm">
      <HStack className="items-center" space="sm">
        <Icon as={InfoIcon} className="text-primary-500" />
        <Text className="text-lg font-semibold text-gray-800">{title}</Text>
      </HStack>
      {children}
    </VStack>
  );

  if (loading) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <Text className="text-gray-500">Carregando detalhes do equipamento...</Text>
      </Box>
    );
  }

  if (!equipment) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <Text className="text-gray-500">Equipamento não encontrado</Text>
      </Box>
    );
  }

  const equipmentTypeMeta = resolveEquipmentType(equipment.type);
  const equipmentStatusMeta = resolveEquipmentStatus(equipment.status);

  const isSendDisabled = syncStatus === 'synced' || !isOnline || sending;
  const submitGradientColors = isSendDisabled
    ? ['#94A3B8', '#94A3B8'] as const
    : HEADER_GRADIENT_COLORS;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
        <Box className="flex-1 bg-background">
          {sending && (
            <Box className="absolute inset-0 bg-white bg-opacity-95 z-50 justify-center items-center">
              <Box className="bg-white rounded-xl p-8 items-center shadow-lg border border-gray-200" style={{ maxWidth: 320 }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-800 text-xl font-semibold mt-6 text-center">
                  {uploadStatus || 'Enviando registro...'}
                </Text>
                <Text className="text-gray-600 text-base mt-3 text-center">
                  Por favor, aguarde
                </Text>
                {uploadStatus.includes('upload') && (
                  <Box className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Text className="text-blue-700 text-xs text-center">
                      ⏱️ O upload pode levar alguns momentos dependendo do tamanho das imagens
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Box className="overflow-hidden">
            <LinearGradient
              colors={HEADER_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                paddingTop: isHeaderCollapsed
                  ? (Platform.OS === 'ios' ? 24 : 20)
                  : Platform.OS === 'ios' ? 56 : 48,
                paddingBottom: isHeaderCollapsed ? 14 : 20,
                paddingHorizontal: 20,
                borderBottomLeftRadius: 28,
                borderBottomRightRadius: 28,
              }}
            >
              <VStack space={isHeaderCollapsed ? 'md' : 'lg'}>
                <HStack className="items-center justify-between">
                  <Pressable onPress={() => router.back()} className="bg-white/10 p-2 rounded-full">
                    <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
                  </Pressable>
                  <Box className="w-10" />
                </HStack>

                {isHeaderCollapsed ? (
                  <Heading size="2xl" className="text-white font-bold">
                    Registro de Manutenção
                  </Heading>
                ) : (
                  <VStack space="md">
                    <Heading size="md" className="text-white font-semibold uppercase tracking-[2px]">
                      Manutenção
                    </Heading>
                    <VStack space="xs">
                      <Text className="text-white/60 text-[11px] uppercase tracking-[3px] font-semibold">
                        Gestão de ativos
                      </Text>
                      <Heading size="2xl" className="text-white font-bold">
                        Registro de Manutenção
                      </Heading>
                      <Text className="text-white/80 text-xs">
                        Atualize o histórico e registre intervenções neste equipamento.
                      </Text>
                    </VStack>

                    <Box
                      className="rounded-3xl"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                      }}
                    >
                      <VStack space="md">
                        <VStack space="xs">
                          <Text className="text-white/60 text-[11px] uppercase tracking-wide">
                            Equipamento
                          </Text>
                          <Heading size="lg" className="text-white font-semibold">
                            {equipment.name}
                          </Heading>
                          <Text className="text-white/80 text-xs">
                            {equipmentTypeMeta.label} • {equipment.location.address}
                          </Text>
                        </VStack>

                        <HStack space="sm" className="items-center justify-between flex-wrap">
                          <HStack space="sm" className="items-center">
                            <Box className="rounded-full bg-white/20 px-3 py-1">
                              <Text className="text-white text-xs font-semibold uppercase tracking-wide">
                                {equipmentStatusMeta.label}
                              </Text>
                            </Box>
                            <Box className="rounded-full bg-white/20 px-3 py-1">
                              <Text className="text-white text-xs font-semibold uppercase tracking-wide">
                                {getSyncStatusText(syncStatus)}
                              </Text>
                            </Box>
                            {!isOnline && (
                              <Box className="rounded-full bg-yellow-400/30 px-3 py-1">
                                <Text className="text-yellow-100 text-xs font-semibold uppercase tracking-wide">
                                  Offline
                                </Text>
                              </Box>
                            )}
                          </HStack>

                          {pendingCount > 0 && (
                            <HStack space="xs" className="items-center">
                              <Box className="w-2 h-2 rounded-full bg-yellow-300" />
                              <Text className="text-yellow-100 text-xs font-medium">
                                {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </VStack>
            </LinearGradient>
          </Box>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 24
            }}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
          >
            <VStack className="px-6 pt-6" space="lg">
        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E0E9FF',
            paddingHorizontal: 20,
            paddingVertical: 20,
          }}
        >
          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Heading size="lg" className="text-gray-800 font-bold">
                {equipment.name}
              </Heading>
              <Box
                className="px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: equipmentStatusMeta.badgeColors.backgroundColor,
                  borderColor: equipmentStatusMeta.badgeColors.borderColor,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: equipmentStatusMeta.badgeColors.textColor }}
                >
                  {equipmentStatusMeta.label}
                </Text>
              </Box>
            </HStack>
            <Text className="text-gray-600">{equipmentTypeMeta.label} • {equipment.location.address}</Text>
          </VStack>
        </Box>
        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E0E9FF',
            paddingHorizontal: 20,
            paddingVertical: 20,
          }}
        >
          <VStack space="md">
            <HStack className="items-center" space="sm">
              <Icon as={EditIcon} className="text-primary-500" />
              <Text className="text-lg font-semibold text-gray-800">Formulário de Revisão</Text>
            </HStack>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Título do Registro</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Digite um título para este registro de manutenção..."
                  value={formData.title}
                  onChangeText={(text) => updateFormData({ title: text })}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Data da Revisão</FormControlLabelText>
              </FormControlLabel>
              <DateInput
                value={formData.reviewDate}
                onValueChange={(date) => updateFormData({ reviewDate: date })}
                placeholder="DD/MM/AAAA"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Status após Revisão</FormControlLabelText>
              </FormControlLabel>
              <CustomSelect
                placeholder="Selecione o status"
                options={maintenanceStatusOptions}
                selectedValue={formData.statusAfterReview}
                onValueChange={(value) => updateFormData({ statusAfterReview: value as any })}
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Descrição Detalhada do Serviço</FormControlLabelText>
              </FormControlLabel>
              <TextInput
                className="p-3 border border-gray-300 rounded-lg text-gray-800"
                multiline
                numberOfLines={4}
                placeholder="Descreva detalhadamente o serviço realizado..."
                value={formData.serviceDescription}
                onChangeText={(text) => updateFormData({ serviceDescription: text })}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Peças Trocadas / Ajustes Realizados</FormControlLabelText>
              </FormControlLabel>
              <TextInput
                className="p-3 border border-gray-300 rounded-lg text-gray-800"
                multiline
                numberOfLines={3}
                placeholder="Descreva as peças trocadas ou ajustes realizados..."
                value={formData.partsReplaced}
                onChangeText={(text) => updateFormData({ partsReplaced: text })}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Próxima Data Sugerida para Manutenção</FormControlLabelText>
              </FormControlLabel>
              <DateInput
                value={formData.nextMaintenanceDate}
                onValueChange={(date) => updateFormData({ nextMaintenanceDate: date })}
                placeholder="DD/MM/AAAA"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700 font-medium">Anexos</FormControlLabelText>
              </FormControlLabel>
              
              <VStack space="sm">
                <HStack space="sm">
                  <Button
                    onPress={showMediaOptions}
                    action="secondary"
                    className="flex-1"
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#6B7280" />
                    <ButtonText>Adicionar Mídia</ButtonText>
                  </Button>
                  
                  <Button
                    onPress={showFormatInfo}
                    action="secondary"
                    size="sm"
                    className="px-3"
                  >
                    <MaterialIcons name="info" size={16} color="#6B7280" />
                  </Button>
                </HStack>
                
                {attachments.length > 0 && (
                  <VStack space="sm">
                    <HStack className="items-center justify-between">
                      <Text className="text-gray-600 text-sm font-medium">
                        Anexos ({attachments.length}):
                      </Text>
                      <Box className="bg-blue-100 rounded-full px-2 py-1">
                        <Text className="text-blue-600 text-xs font-medium">
                          {attachments.filter(a => a.type === 'image').length} 📷 {attachments.filter(a => a.type === 'video').length} 🎥
                        </Text>
                      </Box>
                    </HStack>
                    
                    {(() => {
                      const incompatibleFiles = attachments.filter(attachment => {
                        if (!fileDetails[attachment.uri]) return false;
                        const validation = validateMediaFormat(
                          fileDetails[attachment.uri].mimeType,
                          fileDetails[attachment.uri].size
                        );
                        return !validation.isValid;
                      });
                      
                      if (incompatibleFiles.length > 0) {
                        return (
                          <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <HStack className="items-center" space="sm">
                              <MaterialIcons name="warning" size={20} color="#D97706" />
                              <VStack className="flex-1">
                                <Text className="text-yellow-800 font-medium text-sm">
                                  Arquivos Incompatíveis
                                </Text>
                                <Text className="text-yellow-700 text-xs">
                                  {incompatibleFiles.length} arquivo(s) não são compatíveis com o servidor. 
                                  Eles serão rejeitados durante o envio.
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                    
                    <Box className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {attachments.map((attachment, index) => (
                        <Box 
                          key={index} 
                          className="bg-gray-50 rounded-lg p-3"
                          style={{ width: Platform.OS === 'web' ? 200 : '48%' }}
                        >
                          <VStack className="items-center" space="sm">
                            <Box className="relative">
                              {attachment.type === 'image' ? (
                                <Image
                                  source={{ uri: attachment.uri }}
                                  className="w-20 h-20 rounded-lg"
                                  resizeMode="cover"
                                />
                              ) : (
                                <Box className="w-20 h-20 bg-gray-200 rounded-lg items-center justify-center">
                                  <MaterialIcons 
                                    name="videocam" 
                                    size={28} 
                                    color="#6B7280" 
                                  />
                                  <Text className="text-gray-500 text-xs mt-1">Vídeo</Text>
                                </Box>
                              )}
                              
                              <Box className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                                <MaterialIcons 
                                  name={attachment.type === 'image' ? 'image' : 'videocam'} 
                                  size={12} 
                                  color="white" 
                                />
                              </Box>
                              
                              {attachment.type === 'video' && (
                                <Box className="absolute bottom-1 right-1 bg-black bg-opacity-70 rounded px-1 py-0.5">
                                  <Text className="text-white text-xs">00:30</Text>
                                </Box>
                              )}
                              
                              {fileDetails[attachment.uri] && (
                                (() => {
                                  const validation = validateMediaFormat(
                                    fileDetails[attachment.uri].mimeType, 
                                    fileDetails[attachment.uri].size
                                  );
                                  return validation.isValid ? (
                                    <Box className="absolute -top-1 -left-1 bg-green-500 rounded-full w-4 h-4 items-center justify-center">
                                      <MaterialIcons name="check" size={10} color="white" />
                                    </Box>
                                  ) : (
                                    <Box className="absolute -top-1 -left-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                                      <MaterialIcons name="warning" size={10} color="white" />
                                    </Box>
                                  );
                                })()
                              )}
                            </Box>
                            
                            <VStack className="items-center" space="xs">
                              <Text className="text-gray-800 font-medium text-center">
                                {attachment.type === 'image' ? 'Imagem' : 'Vídeo'} {index + 1}
                              </Text>
                              <Text className="text-gray-500 text-xs text-center">
                                {attachment.uri.split('/').pop()?.substring(0, 15)}...
                              </Text>
                              
                              {fileDetails[attachment.uri] && (
                                <VStack className="items-center" space="xs">
                                  <Text className="text-gray-400 text-xs">
                                    {formatFileSize(fileDetails[attachment.uri].size)}
                                  </Text>
                                  <Text className="text-gray-400 text-xs">
                                    {fileDetails[attachment.uri].mimeType.split('/')[1]?.toUpperCase()}
                                  </Text>
                                </VStack>
                              )}
                              
                              <Pressable
                                onPress={() => handleRemoveAttachment(attachment.id, attachment.uri)}
                                className="px-3 py-1 bg-red-100 rounded-full"
                              >
                                <HStack className="items-center" space="xs">
                                  <Text className="text-red-600 text-xs font-medium">Remover</Text>
                                </HStack>
                              </Pressable>
                            </VStack>
                          </VStack>
                        </Box>
                      ))}
                    </Box>
                  </VStack>
                )}
              </VStack>
            </FormControl>
          </VStack>
        </Box>
        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E0E9FF',
            paddingHorizontal: 20,
            paddingVertical: 20,
          }}
        >
          <VStack space="md">
            {!isOnline && (
              <Box className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <HStack space="sm" className="items-center">
                  <Icon as={DownloadIcon} className="text-yellow-600" size="sm" />
                  <Text className="text-yellow-800 text-sm flex-1">
                    Você está offline. Use &quot;Salvar Offline&quot; para sincronizar depois.
                  </Text>
                </HStack>
              </Box>
            )}

            <HStack space="sm">
              <Pressable
                disabled={sending}
                onPress={handleSaveOffline}
                className="flex-1 rounded-2xl overflow-hidden"
                style={{ opacity: sending ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={SECONDARY_GRADIENT_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' }}
                >
                  <HStack className="items-center" space="sm">
                    <Icon as={DownloadIcon} className="text-white" />
                    <Text className="text-white font-semibold">Salvar Offline</Text>
                  </HStack>
                </LinearGradient>
              </Pressable>

              <Pressable
                disabled={isSendDisabled}
                onPress={() => {
                  console.log('Botão enviar pressionado, sending:', sending);
                  handleSend();
                }}
                className="flex-1 rounded-2xl overflow-hidden"
                style={{ opacity: isSendDisabled ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={submitGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' }}
                >
                  {sending ? (
                    <HStack className="items-center" space="sm">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-semibold">Enviando...</Text>
                    </HStack>
                  ) : (
                    <HStack className="items-center" space="sm">
                      <Icon as={ShareIcon} className="text-white" />
                      <Text className="text-white font-semibold">Enviar</Text>
                    </HStack>
                  )}
                </LinearGradient>
              </Pressable>
            </HStack>

            {pendingCount > 0 && (
              <Pressable onPress={showPendingSyncInfo}>
                <Box className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <HStack space="sm" className="items-center">
                    <Icon as={InfoIcon} className="text-blue-600" size="sm" />
                    <Text className="text-blue-800 text-sm flex-1">
                      {pendingCount} manutenç{pendingCount === 1 ? 'ão' : 'ões'} aguardando sincronização
                    </Text>
                    <Text className="text-blue-600 text-xs font-semibold">Ver</Text>
                  </HStack>
                </Box>
              </Pressable>
            )}

            {sending && (
              <Box className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <HStack className="items-center" space="sm">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-blue-800 text-sm">
                    Enviando registro de manutenção... Por favor, aguarde.
                  </Text>
                </HStack>
              </Box>
            )}

            {!isOnline && !sending && (
              <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <HStack className="items-center" space="sm">
                  <Icon as={InfoIcon} className="text-yellow-600" />
                  <Text className="text-yellow-800 text-sm">
                    Modo offline ativo. Os dados serão sincronizados quando a conexão for restaurada.
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>

        <Box className="h-4" />
            </VStack>
          </ScrollView>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
