import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon, ShareIcon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, Modal, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

interface QRCodeButtonProps {
  equipmentId: string;
  equipmentName: string;
  disabled?: boolean;
}

export default function QRCodeButton({ equipmentId, equipmentName, disabled = false }: QRCodeButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const qrRef = useRef<View>(null);
  const [qrReady, setQrReady] = useState(false);
  const qrSvgRef = useRef<any>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const BUTTON_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;

  const generateQRData = () => {
    const qrData = Linking.createURL('/equipment-details', {
      queryParams: {
        id: equipmentId,
        fromQR: 'true',
      },
    });
    console.log('QR Code Data:', qrData);
    return qrData;
  };

  const shareQRCode = async () => {
    try {
      console.log('Sharing QR Code');
      console.log('QR Code Data:', generateQRData());
      console.log('Equipment ID:', equipmentId);
      console.log('Equipment Name:', equipmentName);
      console.log('QR View Ref:', qrRef.current);
      console.log('QR SVG Ref:', !!qrSvgRef.current);

      let uri: string | null = null;
      if (qrSvgRef.current && typeof qrSvgRef.current.toDataURL === 'function') {
        const base64: string = await new Promise((resolve, reject) => {
          try {
            qrSvgRef.current.toDataURL((data: string) => resolve(data));
          } catch (e) {
            reject(e);
          }
        });
        const cleanBase64 = base64.startsWith('data:image') ? base64.split(',')[1] : base64;
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const filePath = `${cacheDir}qr-${equipmentId}.png`;
        await FileSystem.writeAsStringAsync(
          filePath,
          cleanBase64,
          { encoding: ((FileSystem as any).EncodingType?.Base64 || 'base64') as any }
        );
        uri = filePath;
      }

      if (!uri) {
        if (!qrRef.current) {
          Alert.alert('Aguarde', 'Preparando o QR Code para compartilhar...');
          return;
        }
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
        uri = await captureRef(qrRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `QR Code - ${equipmentName}`,
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
      }
    } catch (error) {
      console.error('Erro ao compartilhar QR Code:', error);
      Alert.alert('Erro', 'Erro ao compartilhar QR Code');
    }
  };

  if (!equipmentId) {
    console.error('Equipment ID está vazio:', equipmentId);
    return (
      <VStack className="bg-white rounded-lg p-4 mb-4" space="sm">
        <HStack className="items-center justify-between">
          <Button disabled className="bg-gray-400">
            <HStack className="items-center" space="sm">
              <Icon as={ShareIcon} className="text-white"/>
              <ButtonText className="text-white">ID Inválido</ButtonText>
            </HStack>
          </Button>
        </HStack>
      </VStack>
    );
  }

  return (
    <>
      <VStack className="rounded-2xl mb-4" space="lg">
        <Pressable
          onPress={() => {
            if (!disabled) {
              setShowModal(true);
            } else {
              Alert.alert(
                'Acesso restrito',
                'Somente administradores podem gerar ou compartilhar o QR Code deste equipamento.'
              );
            }
          }}
          className={`rounded-2xl overflow-hidden ${disabled ? 'opacity-60' : ''}`}
        >
          <LinearGradient
            colors={BUTTON_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, borderRadius: 24 }}
          >
            <HStack className="items-center justify-center" space="sm">
              <Icon as={ShareIcon} className="text-white text-xl" style={{ color: '#FFFFFF' }} />
              <Text className="text-white font-semibold text-lg">
                {disabled ? 'QR Code restrito' : 'Gerar QR Code'}
              </Text>
            </HStack>
          </LinearGradient>
        </Pressable>
      </VStack>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: screenWidth - 48 }]}>
            <Text className="text-xl font-bold text-gray-800" style={{ textAlign: 'center', marginBottom: 12 }}>
              QR Code - {equipmentName}
            </Text>
            
            <Text className="text-xs text-gray-500" style={{ textAlign: 'center', marginBottom: 8 }}>
              ID: {equipmentId} | URL: {generateQRData()}
            </Text>
            
            <View style={styles.qrContainer}>
              <View
                ref={qrRef}
                collapsable={false}
                renderToHardwareTextureAndroid
                onLayout={() => setQrReady(true)}
                style={styles.qrBox}
              >
                <QRCode
                  value={generateQRData()}
                  size={200}
                  color="black"
                  backgroundColor="white"
                  quietZone={10}
                  getRef={(c: any) => (qrSvgRef.current = c)}
                  onError={(error: any) => console.error('QR Code Error:', error)}
                />
                <Text style={styles.equipmentName}>{equipmentName}</Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600" style={{ textAlign: 'center', marginVertical: 8 }}>
              Escaneie este QR Code para acessar os detalhes do equipamento
            </Text>
            <HStack className="justify-between" space="md">
              <Button onPress={() => setShowModal(false)} className="flex-1 bg-gray-500" style={{ marginRight: 8 }}>
                <ButtonText className="text-white">Fechar</ButtonText>
              </Button>
              <Button onPress={shareQRCode} disabled={!qrReady} className="flex-1 bg-primary-500">
                <HStack className="items-center justify-center" space="sm">
                  <Icon as={ShareIcon} className="text-white" />
                  <ButtonText className="text-white">Compartilhar</ButtonText>
                </HStack>
              </Button>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  qrBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  equipmentName: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
}); 