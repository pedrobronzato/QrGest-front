import QRCodeButton from '@/components/QRCodeButton';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  EditIcon,
  GlobeIcon,
  Icon,
  InfoIcon,
  MailIcon,
  SettingsIcon
} from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { Equipment, EquipmentSpecificFieldWithValue, getEquipmentById } from '@/services/equipment';
import { resolveEquipmentStatus, resolveEquipmentType } from '@/utils/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const CARD_BORDER_COLOR = '#B3CDFF';
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const CARD_DIVIDER_COLOR = '#E5EDFF';
const HEADER_PILL_BACKGROUND = 'rgba(255,255,255,0.16)';
const ICON_BADGE_BACKGROUND = '#EEF4FF';

type DetailItem = {
  key: string;
  label: string;
  value?: string | number | undefined;
  icon?: any;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('pt-BR');
};

const resolveLocationLabel = (location?: Equipment['location']) => {
  if (!location) {
    return 'Localização não informada';
  }

  return location.address || 'Localização não informada';
};

export default function EquipmentDetailsScreen() {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const { idToken, userProfile } = useAuthContext();
  const { id, fromQR } = useLocalSearchParams<{ id: string; fromQR?: string }>();
  const isFromQrCode = typeof fromQR === 'string' && ['true', '1', 'yes'].includes(fromQR.toLowerCase());

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  const loadEquipment = useCallback(async () => {
    if (!id) {
      Alert.alert('Erro', 'ID do equipamento não fornecido');
      handleGoBack();
      return;
    }

    try {
      setLoading(true);
      const result = await getEquipmentById(id, idToken || undefined);
      
      if (result.success && result.data) {
        setEquipment(result.data);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao carregar equipamento');
        handleGoBack();
      }
    } catch (error) {
      console.error('Erro ao carregar equipamento:', error);
      Alert.alert('Erro', 'Erro ao carregar equipamento');
      handleGoBack();
    } finally {
      setLoading(false);
    }
  }, [handleGoBack, id, idToken]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const getSelectedEquipmentText = (selectedEquipment: string) => {
    const equipmentMap: Record<string, string> = {
      'hydraulic_cylinder': 'Cilindro Hidráulico',
      'hydraulic_pump': 'Bomba Hidráulica',
      'hydraulic_valve': 'Válvula Hidráulica',
      'pneumatic_cylinder': 'Cilindro Pneumático',
      'pneumatic_valve': 'Válvula Pneumática',
      'pneumatic_compressor': 'Compressor Pneumático',
      'electrical_motor': 'Motor Elétrico',
      'electrical_pump': 'Bomba Elétrica',
      'mechanical_gear': 'Engrenagem Mecânica',
      'mechanical_bearing': 'Rolamento Mecânico'
    };
    return equipmentMap[selectedEquipment] || selectedEquipment;
  };

  const formatDetailKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetailValue = (value: string | number, key: string) => {
    if (typeof value === 'number') {
      if (key.includes('diameter') || key.includes('stroke')) {
        return `${value} mm`;
      }
      if (key.includes('pressure')) {
        return `${value} MPa`;
      }
      if (key.includes('flow')) {
        return `${value} L/min`;
      }
      if (key.includes('power')) {
        return `${value} kW`;
      }
      if (key.includes('speed')) {
        return `${value} rpm`;
      }
      if (key.includes('temperature')) {
        return `${value} °C`;
      }
    }
    return value.toString();
  };

const isFieldWithValueArray = (
  value: EquipmentSpecificFieldWithValue[] | Record<string, string | number> | undefined
): value is EquipmentSpecificFieldWithValue[] => {
  return Array.isArray(value);
};

const mapFieldsToDetailItems = (
  value: EquipmentSpecificFieldWithValue[] | Record<string, string | number> | undefined,
  fallbackLabel: string
): DetailItem[] => {
  if (isFieldWithValueArray(value)) {
    return value.map((field) => ({
      key: field.id || field.name,
      label: field.name || formatDetailKey(field.id || fallbackLabel),
      value:
        field.value !== undefined && field.value !== null
          ? typeof field.value === 'number'
            ? field.value
            : field.value.toString()
          : '—',
    }));
  }

  if (value) {
    return Object.entries(value).map(([key, fieldValue]) => ({
      key,
      label: formatDetailKey(key),
      value:
        fieldValue !== undefined && fieldValue !== null
          ? formatDetailValue(fieldValue, key)
          : '—',
    }));
  }

  return [];
};


  const renderDetailSection = (
    title: string,
    sectionIcon: any,
    items: DetailItem[]
  ) => {
    if (!items.length) {
      return null;
    }

    return (
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

        <HStack className="items-center" space="sm" style={{ marginBottom: 16 }}>
          <Box
            className="p-2 rounded-full"
            style={{ backgroundColor: ICON_BADGE_BACKGROUND }}
          >
            <Icon as={sectionIcon ?? InfoIcon} className="text-primary-500" />
          </Box>
          <Heading size="lg" className="text-neutral-900">
            {title}
          </Heading>
        </HStack>

        <VStack>
          {items.map((item, index) => (
            <HStack
              key={item.key}
              className="items-start"
              space="sm"
              style={{
                paddingVertical: 12,
                borderBottomWidth: index === items.length - 1 ? 0 : 1,
                borderColor: CARD_DIVIDER_COLOR,
              }}
            >
              <HStack className="items-center flex-1" space="sm">
                {item.icon && (
                  <Box
                    className="p-2 rounded-full"
                    style={{ backgroundColor: ICON_BADGE_BACKGROUND }}
                  >
                    <Icon as={item.icon} className="text-primary-500" />
                  </Box>
                )}
                <Text className="text-neutral-500 text-sm font-medium">
                  {item.label}
                </Text>
              </HStack>

              <Box className="flex-1 items-end">
                <Text className="text-neutral-900 text-sm font-semibold text-right">
                  {item.value !== undefined && item.value !== null ? item.value : 'N/A'}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  };

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

  const locationLabel = resolveLocationLabel(equipment.location);
  const installationDate = formatDate(equipment.installationDate);
  const createdAt = formatDate(equipment.createdAt);
  const updatedAt = formatDate(equipment.updatedAt);
  const statusMeta = resolveEquipmentStatus(equipment.status);
  const statusBadgeColors = statusMeta.badgeColors;
  const typeMeta = resolveEquipmentType(equipment.type);
  const isAdmin = userProfile?.role === 'admin';
  const canRegisterMaintenance = isFromQrCode || !equipment.onlyOnSiteMaintenance;

  const generalInformation: DetailItem[] = [
    {
      key: 'type',
      label: 'Tipo',
      value: typeMeta.label,
      icon: SettingsIcon,
    },
    {
      key: 'selectedEquipment',
      label: 'Categoria',
      value: getSelectedEquipmentText(equipment.selectedEquipment),
      icon: SettingsIcon,
    },
    {
      key: 'installationDate',
      label: 'Data de instalação',
      value: installationDate,
      icon: CalendarDaysIcon,
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      value: createdAt,
      icon: CalendarDaysIcon,
    },
    {
      key: 'updatedAt',
      label: 'Última atualização',
      value: updatedAt,
      icon: CalendarDaysIcon,
    },
  ];

  const locationInformation: DetailItem[] = [
    {
      key: 'address',
      label: 'Endereço',
      value: locationLabel,
      icon: MailIcon,
    },
  ];

  if (equipment.location?.coordinates) {
    locationInformation.push(
      {
        key: 'latitude',
        label: 'Latitude',
        value: equipment.location.coordinates.latitude.toFixed(6),
        icon: GlobeIcon,
      },
      {
        key: 'longitude',
        label: 'Longitude',
        value: equipment.location.coordinates.longitude.toFixed(6),
        icon: GlobeIcon,
      }
    );
  }

  const technicalDetails = mapFieldsToDetailItems(equipment.details, 'Detalhe');

  const specificFields = mapFieldsToDetailItems(equipment.specificFields, 'Campo específico');

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
              paddingBottom: 32,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
            }}
          >
            <VStack space="lg">
              <HStack className="items-center justify-between">
                <Pressable
                  onPress={handleGoBack}
                  className="bg-white/10 p-2 rounded-full"
                >
                  <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
                </Pressable>

                <Heading size="lg" className="text-white font-semibold">
                  Detalhes
                </Heading>

                <Pressable onPress={() => console.log('Editar equipamento:', equipment.id)}>
                  <Icon as={EditIcon} className="text-white text-xl" />
                </Pressable>
              </HStack>

              <VStack space="xs">
                <Text className="text-white/60 text-xs uppercase tracking-[3px] font-semibold">
                  Gestão de ativos
                </Text>
                <Heading size="3xl" className="text-white font-bold">
                  Detalhes do equipamento
                </Heading>
         
              </VStack>
       

              <Box
                className="rounded-3xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                }}
              >
                <VStack space="md">
                  <VStack space="xs">
                    <Heading size="2xl" className="text-white font-bold">
                      {equipment.name}
                    </Heading>

                    <HStack space="sm" className="flex-wrap items-center">
                      <Box
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: HEADER_PILL_BACKGROUND }}
                      >
                        <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                          {typeMeta.label}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>

                  <HStack space="sm" className="items-center">
                    <Box
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: statusBadgeColors.backgroundColor,
                      }}
                    >
                      <Text
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: statusBadgeColors.textColor }}
                      >
                        {statusMeta.label}
                      </Text>
                    </Box>
                    <Text className="text-white/80 text-xs">
                      Atualizado em {updatedAt}
                    </Text>
                  </HStack>

                  <HStack space="sm" className="items-start">
                    <Text className="text-white/80 text-sm flex-1">
                      {locationLabel}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </LinearGradient>
        </Box>

        <VStack className="px-6 mt-6" space="lg">
          {renderDetailSection('Informações gerais', InfoIcon, generalInformation)}
          {renderDetailSection('Localização', GlobeIcon, locationInformation)}
          {renderDetailSection('Especificações técnicas', InfoIcon, technicalDetails)}
          {renderDetailSection('Campos específicos', SettingsIcon, specificFields)}
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
              <VStack space="xs">
                <Heading size="lg" className="text-neutral-900">
                  Ações rápidas
                </Heading>
                <Text className="text-neutral-500 text-sm">
                  {canRegisterMaintenance
                    ? 'Registre uma nova manutenção ou gere o QR Code do equipamento.'
                    : 'Para registrar manutenções é necessário ler o QR Code no local.'}
                </Text>
              </VStack>

              <QRCodeButton
                equipmentId={equipment._id || equipment.id}
                equipmentName={equipment.name}
                disabled={!isAdmin}
              />

              {canRegisterMaintenance ? (
                <Pressable
                  onPress={() => router.push(`/equipment-maintenance?id=${equipment._id || equipment.id}`)}
                  className="rounded-2xl overflow-hidden"
                >
                  <LinearGradient
                    colors={HEADER_GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 16, borderRadius: 20 }}
                  >
                    <HStack className="items-center justify-center" space="sm">
                      <Icon as={SettingsIcon} className="text-white text-xl" style={{ color: '#FFFFFF' }} />
                      <Text className="text-white font-semibold text-lg">
                        Registrar manutenção
                      </Text>
                    </HStack>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Box className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3">
                  <Text className="text-primary-600 text-sm font-medium">
                    Este equipamento exige leitura do QR Code no local para registrar manutenções.
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
} 