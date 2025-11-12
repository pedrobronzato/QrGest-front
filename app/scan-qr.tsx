import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { ArrowLeftIcon, Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, TextInput } from 'react-native';

export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    console.log('permission', permission);
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (isFocused && permission?.granted && !cameraReady) {
      const timeout = setTimeout(() => {
        if (!cameraReady) {
          console.warn('Câmera não carregou em 5 segundos');
          setCameraError('A câmera está demorando para carregar. Verifique se não há outros aplicativos usando a câmera.');
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isFocused, permission?.granted, cameraReady]);

  const parseEquipmentId = useCallback((rawData: string): string | null => {
    if (!rawData) return null;

    try {
      const url = new URL(rawData);
      const fromQuery = url.searchParams.get('id');
      if (fromQuery) return fromQuery;

      const path = url.pathname || '';
      const equipmentMatch = path.match(/\/equipment\/?([a-zA-Z0-9_-]+)/);
      if (equipmentMatch && equipmentMatch[1]) return equipmentMatch[1];
    } catch (_) {
    }

    const trimmed = rawData.trim();
    if (trimmed.length > 0) return trimmed;
    return null;
  }, []);

  const handleBarcodeScanned = useCallback((result: any) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const data: string | undefined = result?.data || result?.nativeEvent?.codeStringValue;
    const equipmentId = data ? parseEquipmentId(data) : null;

    if (equipmentId) {
      router.replace(`/equipment-details?id=${encodeURIComponent(equipmentId)}`);
    } else {
      Alert.alert(
        'QR Code inválido',
        'Não foi possível identificar o equipamento a partir do QR Code.',
        [
          {
            text: 'Tentar novamente',
            onPress: () => setIsProcessing(false),
          },
          {
            text: 'Entrada manual',
            onPress: () => {
              setIsProcessing(false);
              setShowManualInput(true);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [isProcessing, parseEquipmentId]);

  const handleManualSubmit = useCallback(() => {
    if (!manualId.trim()) {
      Alert.alert('Erro', 'Por favor, digite o ID do equipamento.');
      return;
    }
    
    router.replace(`/equipment-details?id=${encodeURIComponent(manualId.trim())}`);
  }, [manualId]);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }, []);

  if (!permission) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <Text className="text-gray-600">Verificando permissões da câmera...</Text>
      </Box>
    );
  }

  if (!permission.granted) {
    return (
      <Box className="flex-1 bg-background justify-center items-center px-6">
        <VStack space="md" className="items-center">
          <Text className="text-gray-800 text-lg font-semibold text-center">
            Permissão de câmera necessária
          </Text>
          <Text className="text-gray-600 text-center">
            Conceda acesso à câmera para escanear o QR Code do equipamento.
          </Text>
          <Pressable onPress={requestPermission} className="bg-primary-500 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Conceder Permissão</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="px-6 py-3">
            <Text className="text-primary-500 font-semibold">Voltar</Text>
          </Pressable>
        </VStack>
      </Box>
    );
  }

  if (!isFocused) {
    return (
      <Box className="flex-1 bg-black" />
    );
  }

  if (cameraError) {
    return (
      <Box className="flex-1 bg-background justify-center items-center px-6">
        <VStack space="md" className="items-center">
          <Text className="text-red-600 text-lg font-semibold text-center">
            Erro da Câmera
          </Text>
          <Text className="text-gray-600 text-center">
            {cameraError}
          </Text>
          <Pressable onPress={() => setCameraError(null)} className="bg-primary-500 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Tentar Novamente</Text>
          </Pressable>
          <Pressable onPress={() => setShowManualInput(true)} className="bg-gray-500 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Entrada Manual</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="px-6 py-3">
            <Text className="text-primary-500 font-semibold">Voltar</Text>
          </Pressable>
        </VStack>
      </Box>
    );
  }

  if (showManualInput) {
    return (
      <Box className="flex-1 bg-background px-6 py-8">
        <VStack space="lg" className="flex-1">
          <HStack className="items-center justify-between">
            <Pressable onPress={() => setShowManualInput(false)} className="p-2">
              <Icon as={ArrowLeftIcon} className="text-gray-600 text-xl" />
            </Pressable>
            <Text className="text-gray-800 text-lg font-semibold">Entrada Manual</Text>
            <Box className="w-10" />
          </HStack>

          <VStack space="md" className="flex-1 justify-center">
            <Text className="text-gray-800 text-lg font-semibold text-center">
              Digite o ID do Equipamento
            </Text>
            <Text className="text-gray-600 text-center">
              Insira manualmente o ID do equipamento que você deseja visualizar
            </Text>
            
            <Box className="mt-4">
              <TextInput
                value={manualId}
                onChangeText={setManualId}
                placeholder="Ex: EQUIP001"
                className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleManualSubmit}
              />
            </Box>

            <Pressable onPress={handleManualSubmit} className="bg-primary-500 px-6 py-3 rounded-lg mt-4">
              <Text className="text-white font-semibold text-center">Buscar Equipamento</Text>
            </Pressable>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-black">
      <CameraView
        className="flex-1"
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] } as any}
        onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned as any}
        onMountError={(e: any) => {
          const errorMessage = e?.nativeEvent?.message || e?.message || 'Erro desconhecido';
          console.error('Erro ao montar câmera:', e?.nativeEvent || e);
          console.error('Detalhes do erro:', errorMessage);
          setCameraError(`Não foi possível inicializar a câmera: ${errorMessage}`);
        }}
        onCameraReady={() => {
          console.log('Câmera pronta e funcionando');
          setCameraReady(true);
          setCameraError(null);
        }}
        style={{ flex: 1 }}
      />

      <Box className="absolute top-0 left-0 right-0">
        <HStack className="items-center justify-between px-4 pt-16 pb-4">
          <Pressable onPress={handleGoBack} className="bg-black/50 p-2 rounded-full">
            <Icon as={ArrowLeftIcon} className="text-white w-8 h-8" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Escaneie o QR Code</Text>

        </HStack>
      </Box>

      <Box className="absolute left-0 right-0" style={{ top: '35%' }}>
        <Box className="mx-auto w-72 h-72 rounded-xl" style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' }} />
      </Box>

      <Box className="absolute left-0 right-0 bottom-0 px-6 pb-10">
        <VStack space="sm" className="items-center">
          <Text className="text-white text-center">
            Aponte a câmera para o QR Code do equipamento
          </Text>
          {!cameraReady && permission?.granted && (
            <Text className="text-yellow-200 text-sm">Carregando câmera...</Text>
          )}
          {isProcessing && (
            <Text className="text-gray-200 text-sm">Lendo QR Code...</Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}


