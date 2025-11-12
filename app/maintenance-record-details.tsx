import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  GlobeIcon,
  Icon,
  InfoIcon,
  MailIcon,
  SettingsIcon,
  UserIcon
} from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { MaintenanceRecord, getMaintenanceRecordById } from '@/services/equipment';
import { resolveEquipmentStatus, resolveEquipmentType } from '@/utils/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, TouchableOpacity } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const CARD_BORDER_COLOR = '#E0E9FF';
const CARD_DIVIDER_COLOR = '#E5EDFF';
const INFO_CARD_BACKGROUND = '#EEF4FF';

export default function MaintenanceRecordDetailsScreen() {
  const [maintenanceRecord, setMaintenanceRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const { idToken } = useAuthContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const loadMaintenanceRecord = useCallback(async () => {
    if (!id) {
      Alert.alert('Erro', 'ID do registro de manutenção não fornecido');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const result = await getMaintenanceRecordById(id, idToken || undefined);
      
      if (result.success && result.data) {
        setMaintenanceRecord(result.data);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao carregar registro de manutenção');
        router.back();
      }
    } catch (error) {
      console.error('Erro ao carregar registro de manutenção:', error);
      Alert.alert('Erro', 'Erro ao carregar registro de manutenção');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, idToken]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadMaintenanceRecord();
  }, [loadMaintenanceRecord]);

  const renderDetailItem = (
    label: string,
    value: string | number | undefined,
    icon?: any,
    hideDivider = false,
  ) => (
    <HStack
      className="items-start"
      space="sm"
      style={{
        paddingVertical: 12,
        borderBottomWidth: hideDivider ? 0 : 1,
        borderColor: CARD_DIVIDER_COLOR,
      }}
    >
      <HStack className="items-center" space="sm" style={{ flex: 1 }}>
        {icon && (
          <Box
            className="p-2 rounded-full"
            style={{ backgroundColor: INFO_CARD_BACKGROUND }}
          >
            <Icon as={icon} className="text-primary-500" />
          </Box>
        )}
        <Text className="text-neutral-500 text-sm font-medium">
          {label}
        </Text>
      </HStack>
      <Box className="flex-1 items-end">
        <Text className="text-neutral-900 text-sm font-semibold text-right">
          {value !== undefined && value !== null && value !== '' ? value.toString() : '—'}
        </Text>
      </Box>
    </HStack>
  );

  const renderDetailSection = (
    title: string,
    sectionIcon: any,
    children: React.ReactNode,
  ) => (
    <Box
      className="rounded-3xl border shadow-soft-1"
      style={{
        backgroundColor: CARD_BACKGROUND_COLOR,
        borderColor: CARD_BORDER_COLOR,
        paddingHorizontal: 20,
        paddingVertical: 24,
      }}
    >
      <LinearGradient
        colors={HEADER_GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 4,
          width: 72,
          borderRadius: 9999,
          marginBottom: 16,
        }}
      />
      <VStack space="md">
        <HStack className="items-center" space="sm">
          <Box
            className="p-2 rounded-full"
            style={{ backgroundColor: INFO_CARD_BACKGROUND }}
          >
            <Icon as={sectionIcon ?? InfoIcon} className="text-primary-500" />
          </Box>
          <Heading size="lg" className="text-neutral-900">
            {title}
          </Heading>
        </HStack>
        {children}
      </VStack>
    </Box>
  );

  if (loading) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-neutral-500 mt-4">Carregando detalhes do registro...</Text>
      </Box>
    );
  }

  if (!maintenanceRecord) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <Text className="text-gray-500">Registro de manutenção não encontrado</Text>
      </Box>
    );
  }

  const statusAfterReviewMeta = resolveEquipmentStatus(maintenanceRecord.statusAfterReview);
  const equipmentTypeMeta = resolveEquipmentType(maintenanceRecord.equipmentId?.type);
  const equipmentStatusMeta = resolveEquipmentStatus(maintenanceRecord.equipmentId?.status);
  const maintenanceDateFormatted = maintenanceRecord.maintenanceDate
    ? new Date(maintenanceRecord.maintenanceDate).toLocaleDateString('pt-BR')
    : '—';
  const reviewDateFormatted = maintenanceRecord.reviewDate
    ? new Date(maintenanceRecord.reviewDate).toLocaleDateString('pt-BR')
    : '—';
  const nextMaintenanceFormatted = maintenanceRecord.nextMaintenanceDate
    ? new Date(maintenanceRecord.nextMaintenanceDate).toLocaleDateString('pt-BR')
    : '—';
  const createdAtFormatted = maintenanceRecord.createdAt
    ? new Date(maintenanceRecord.createdAt).toLocaleDateString('pt-BR')
    : '—';
  const updatedAtFormatted = maintenanceRecord.updatedAt
    ? new Date(maintenanceRecord.updatedAt).toLocaleDateString('pt-BR')
    : '—';
  const attachments = maintenanceRecord.attachments ?? [];
  const maintenanceItems = [
    { label: 'Data da manutenção', value: maintenanceDateFormatted, icon: CalendarDaysIcon },
    { label: 'Data da revisão', value: reviewDateFormatted, icon: CalendarDaysIcon },
    { label: 'Próxima manutenção', value: nextMaintenanceFormatted, icon: CalendarDaysIcon },
    { label: 'Status após revisão', value: statusAfterReviewMeta.label, icon: SettingsIcon },
  ];
  const equipmentItems = [
    { label: 'Nome', value: maintenanceRecord.equipmentId?.name ?? '—', icon: SettingsIcon },
    { label: 'Tipo', value: equipmentTypeMeta.label, icon: SettingsIcon },
    { label: 'Status', value: equipmentStatusMeta.label, icon: SettingsIcon },
  ];
  if (maintenanceRecord.equipmentId?.location?.address) {
    equipmentItems.push({
      label: 'Endereço',
      value: maintenanceRecord.equipmentId.location.address,
      icon: MailIcon,
    });
  }
  if (maintenanceRecord.equipmentId?.location?.coordinates) {
    equipmentItems.push({
      label: 'Latitude',
      value: maintenanceRecord.equipmentId.location.coordinates.latitude.toFixed(6),
      icon: GlobeIcon,
    });
    equipmentItems.push({
      label: 'Longitude',
      value: maintenanceRecord.equipmentId.location.coordinates.longitude.toFixed(6),
      icon: GlobeIcon,
    });
  }
  const technicianItems = maintenanceRecord.technicianInfo
    ? [
        { label: 'Nome', value: maintenanceRecord.technicianInfo.name, icon: UserIcon },
        { label: 'Email', value: maintenanceRecord.technicianInfo.email, icon: MailIcon },
      ]
    : [];
  const systemItems = [
    { label: 'Criado em', value: createdAtFormatted, icon: CalendarDaysIcon },
    { label: 'Última atualização', value: updatedAtFormatted, icon: CalendarDaysIcon },
  ];

  return (
    <Box className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <Box className="overflow-hidden">
          <LinearGradient
            colors={HEADER_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: '100%',
              paddingTop: 56,
              paddingBottom: 28,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
            }}
          >
            <VStack space="lg">
              <HStack className="items-center justify-between">
                <Pressable onPress={() => router.back()} className="bg-white/10 p-2 rounded-full">
                  <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
                </Pressable>
                <Box className="w-10" />
              </HStack>

              <VStack space="xs">
                <Text className="text-white/60 text-xs uppercase tracking-[3px] font-semibold">
                  Registro de manutenção
                </Text>
                <Heading size="3xl" className="text-white font-bold">
                  {maintenanceRecord.title || 'Relatório de Manutenção'}
                </Heading>
                <Text className="text-white/80 text-sm">
                  Resumo da intervenção realizada no equipamento e status após a revisão.
                </Text>
              </VStack>

              <Box
                className="rounded-3xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  paddingHorizontal: 16,
                  paddingVertical: 18,
                }}
              >
                <VStack space="md">
                  <VStack space="xs">
                    <Heading size="lg" className="text-white font-semibold">
                      {maintenanceRecord.equipmentId?.name || 'Equipamento não informado'}
                    </Heading>
                    <Text className="text-white/70 text-sm">
                      {equipmentTypeMeta.label}
                    </Text>
                  </VStack>

                  <HStack space="sm" className="items-center flex-wrap">
                    <Box
                      className="rounded-full border px-3 py-1"
                      style={{
                        backgroundColor: statusAfterReviewMeta.badgeColors.backgroundColor,
                        borderColor: statusAfterReviewMeta.badgeColors.borderColor,
                      }}
                    >
                      <Text
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: statusAfterReviewMeta.badgeColors.textColor }}
                      >
                        {statusAfterReviewMeta.label}
                      </Text>
                    </Box>
                    <Box className="rounded-full bg-white/20 px-3 py-1">
                      <Text className="text-white text-[11px] font-semibold uppercase tracking-wide">
                        Revisado em {reviewDateFormatted}
                      </Text>
                    </Box>
                    <Box className="rounded-full bg-white/20 px-3 py-1">
                      <Text className="text-white text-[11px] font-semibold uppercase tracking-wide">
                        Próxima: {nextMaintenanceFormatted}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack space="md" className="flex-wrap">
                    {maintenanceRecord.technicianInfo?.name && (
                      <VStack>
                        <Text className="text-white/60 text-[11px] uppercase tracking-wide font-semibold">
                          Responsável
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                          {maintenanceRecord.technicianInfo.name}
                        </Text>
                      </VStack>
                    )}
                    <VStack>
                      <Text className="text-white/60 text-[11px] uppercase tracking-wide font-semibold">
                        Criado em
                      </Text>
                      <Text className="text-white text-sm font-semibold">
                        {createdAtFormatted}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text className="text-white/60 text-[11px] uppercase tracking-wide font-semibold">
                        Atualizado em
                      </Text>
                      <Text className="text-white text-sm font-semibold">
                        {updatedAtFormatted}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </LinearGradient>
        </Box>

        <VStack className="px-6 mt-6" space="lg">
          {renderDetailSection('Informações da manutenção', SettingsIcon, (
            <VStack>
              {maintenanceItems.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                  {renderDetailItem(
                    item.label,
                    item.value,
                    item.icon,
                    index === maintenanceItems.length - 1,
                  )}
                </React.Fragment>
              ))}
            </VStack>
          ))}

          {maintenanceRecord.serviceDescription && (
            renderDetailSection('Descrição do serviço', InfoIcon, (
              <Text className="text-neutral-600 text-sm leading-relaxed">
                {maintenanceRecord.serviceDescription}
              </Text>
            ))
          )}
          {console.log(maintenanceRecord.partsReplaced, 'partsReplaced')}
          {console.log(maintenanceRecord.partsReplaced.length > 0, 'partsReplaced length > 0')}

          {maintenanceRecord.partsReplaced && maintenanceRecord.partsReplaced.length > 0 && (
            renderDetailSection('Peças substituídas / ajustes', InfoIcon, (
              <Text className="text-neutral-600 text-sm leading-relaxed">
                {maintenanceRecord.partsReplaced}
              </Text>
            ))
          )}

          {maintenanceRecord.technicianInfo && (
            renderDetailSection('Responsável pela manutenção', UserIcon, (
              <VStack>
                {technicianItems.map((item, index) => (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {renderDetailItem(
                      item.label,
                      item.value,
                      item.icon,
                      index === technicianItems.length - 1,
                    )}
                  </React.Fragment>
                ))}
              </VStack>
            ))
          )}

          {maintenanceRecord.equipmentId && (
            renderDetailSection('Informações do equipamento', SettingsIcon, (
              <VStack>
                {equipmentItems.map((item, index) => (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {renderDetailItem(
                      item.label,
                      item.value,
                      item.icon,
                      index === equipmentItems.length - 1,
                    )}
                  </React.Fragment>
                ))}
              </VStack>
            ))
          )}

          {attachments.length > 0 && (
            renderDetailSection('Anexos', InfoIcon, (
              <VStack space="sm">
                <Text className="text-neutral-500 text-sm">
                  Toque para visualizar cada evidência em tela cheia.
                </Text>
                <Box className="flex-row flex-wrap" style={{ gap: 12 }}>
                  {attachments.map((attachment, index) => (
                    <TouchableOpacity
                      key={`${attachment}-${index}`}
                      onPress={() => setExpandedImage(attachment)}
                      className="rounded-2xl overflow-hidden border"
                      style={{
                        width: (screenWidth - 96) / 2,
                        borderColor: CARD_BORDER_COLOR,
                      }}
                    >
                      <Image
                        source={{ uri: attachment }}
                        style={{
                          width: '100%',
                          height: 128,
                          resizeMode: 'cover',
                        }}
                      />
                      <Box className="p-3" style={{ backgroundColor: '#F8FAFF' }}>
                        <Text className="text-neutral-700 text-sm font-semibold text-center">
                          Anexo {index + 1}
                        </Text>
                      </Box>
                    </TouchableOpacity>
                  ))}
                </Box>
              </VStack>
            ))
          )}

          {renderDetailSection('Registro no sistema', CalendarDaysIcon, (
            <VStack>
              {systemItems.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                  {renderDetailItem(
                    item.label,
                    item.value,
                    item.icon,
                    index === systemItems.length - 1,
                  )}
                </React.Fragment>
              ))}
            </VStack>
          ))}
        </VStack>
      </ScrollView>

      <Modal
        visible={expandedImage !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <Box className="flex-1 bg-black">
          <Box className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 pt-12 pb-4 px-4">
            <HStack className="items-center justify-between">
              <Pressable onPress={() => setExpandedImage(null)} className="p-2">
                <Icon as={ArrowLeftIcon} className="text-white text-2xl" />
              </Pressable>
              
              <Text className="text-white font-medium text-center flex-1">
                Anexo Expandido
              </Text>
              
              <Box className="w-8" />
            </HStack>
          </Box>

          <Box className="flex-1 justify-center items-center">
            {expandedImage && (
              <Image
                source={{ uri: expandedImage }}
                style={{
                  width: screenWidth,
                  height: screenHeight,
                  resizeMode: 'contain'
                }}
              />
            )}
          </Box>

          <Pressable onPress={() => setExpandedImage(null)}>
          <Box className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
            <Text className="text-white text-center font-medium">
              Toque para fechar
            </Text>
          </Box>
          </Pressable>
        </Box>  

      </Modal>
    </Box>
  );
}
