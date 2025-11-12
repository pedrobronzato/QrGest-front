import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  EyeIcon,
  Icon,
  SearchIcon,
  SettingsIcon
} from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { MaintenanceRecord, getAllMaintenanceRecords } from '@/services/equipment';
import { EQUIPMENT_STATUS_LABELS, EquipmentStatusKey, resolveEquipmentStatus } from '@/utils/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';

const STATUS_FILTER_OPTIONS: { value: 'all' | EquipmentStatusKey; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: EQUIPMENT_STATUS_LABELS.active },
  { value: 'maintenance_pending', label: EQUIPMENT_STATUS_LABELS.maintenance_pending },
  { value: 'inactive', label: EQUIPMENT_STATUS_LABELS.inactive },
];

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const CARD_BORDER_COLOR = '#E0E9FF';
const INFO_CARD_BACKGROUND = '#EEF4FF';
const INFO_CARD_BORDER = '#C7DAFF';
const EMPTY_BADGE_BACKGROUND = '#E8EDFF';
const EMPTY_BADGE_TEXT = '#1D4ED8';

export default function MaintenanceReportsScreen() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EquipmentStatusKey>('all');
  const { idToken, userProfile } = useAuthContext();

  const loadMaintenanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await getAllMaintenanceRecords(idToken || undefined);

      console.log(result, 'result');
      if (result.success && result.data) {
        const records = result.data ?? [];
        setMaintenanceRecords(records);
        setFilteredRecords(records);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao carregar registros de manutenção');
      }
    } catch (error) {
      console.error('Erro ao carregar registros de manutenção:', error);
      Alert.alert('Erro', 'Erro ao carregar registros de manutenção');
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaintenanceRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMaintenanceRecords();
  }, [loadMaintenanceRecords]);

  useEffect(() => {
    let filtered = maintenanceRecords;

    if (searchText) {
      const normalizedSearch = searchText.toLowerCase();
      filtered = filtered.filter(record => {
        const serviceDescription = record.serviceDescription?.toLowerCase() || '';
        const partsReplaced = record.partsReplaced?.toLowerCase() || '';
        const statusMeta = resolveEquipmentStatus(record.statusAfterReview);
        
        return serviceDescription.includes(normalizedSearch) ||
               partsReplaced.includes(normalizedSearch) ||
               statusMeta.label.toLowerCase().includes(normalizedSearch) ||
               (statusMeta.canonical ? statusMeta.canonical.includes(normalizedSearch) : false);
      });
    }

    const selectedStatus = statusFilter === 'all' ? null : statusFilter;

    if (selectedStatus) {
      filtered = filtered.filter(record => {
        const statusKey = resolveEquipmentStatus(record.statusAfterReview).canonical;
        return statusKey === selectedStatus;
      });
    }

    setFilteredRecords(filtered);
  }, [maintenanceRecords, searchText, statusFilter]);

  const handleViewRecord = (record: MaintenanceRecord) => {
    const recordId = record._id || record.id;
    if (recordId) {
      router.push(`/maintenance-record-details?id=${recordId}`);
    } else {
      Alert.alert('Erro', 'ID do registro não encontrado');
    }
  };

  const renderMaintenanceRecord = ({ item }: { item: MaintenanceRecord }) => {
    const statusMeta = resolveEquipmentStatus(item.statusAfterReview);
    const reviewDate = item.reviewDate ? new Date(item.reviewDate).toLocaleDateString('pt-BR') : '—';
    const nextMaintenance = item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toLocaleDateString('pt-BR') : '—';

    return (
      <Pressable onPress={() => handleViewRecord(item)}>
        <Box
          className="rounded-3xl border shadow-soft-1 overflow-hidden"
          style={{
            backgroundColor: CARD_BACKGROUND_COLOR,
            borderColor: CARD_BORDER_COLOR,
            marginBottom: 24,
          }}
        >
          <LinearGradient
            colors={HEADER_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 4, width: '100%' }}
          />

          <VStack className="p-5" space="lg">
            <VStack space="md">
              <HStack className="justify-between items-start" space="md">
                <VStack className="flex-1" space="xs">
                  <Heading size="lg" className="text-neutral-900">
                    {item.title || 'Registro sem título'}
                  </Heading>
                  <Text className="text-neutral-500 text-sm">
                    {item.equipmentId?.name || 'Equipamento não informado'}
                  </Text>
                </VStack>

                <Box
                  className="px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: statusMeta.badgeColors.backgroundColor,
                    borderColor: statusMeta.badgeColors.borderColor,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: statusMeta.badgeColors.textColor }}
                  >
                    {statusMeta.label}
                  </Text>
                </Box>
              </HStack>

              <VStack space="xs">
                <Text className="text-neutral-600 text-sm">
                  <Text className="font-semibold text-neutral-700">Revisado em:</Text> {reviewDate}
                </Text>
                <Text className="text-neutral-600 text-sm">
                  <Text className="font-semibold text-neutral-700">Próxima manutenção:</Text> {nextMaintenance}
                </Text>
                {item.technicianInfo?.name && (
                  <Text className="text-neutral-600 text-sm">
                    <Text className="font-semibold text-neutral-700">Responsável:</Text> {item.technicianInfo.name}
                  </Text>
                )}
              </VStack>

              {item.serviceDescription ? (
                <Text className="text-neutral-500 text-sm leading-relaxed">
                  {item.serviceDescription}
                </Text>
              ) : null}

              {item.partsReplaced && (
                <Box
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: '#F8FAFF',
                    borderColor: '#E0E9FF',
                  }}
                >
                  <Text className="text-neutral-500 text-xs uppercase tracking-[2px] font-semibold mb-1">
                    Peças/Ajustes
                  </Text>
                  <Text className="text-neutral-600 text-sm leading-relaxed">
                    {item.partsReplaced}
                  </Text>
                </Box>
              )}
            </VStack>

            <HStack className="justify-end" space="sm">
              <Box
                className="px-4 py-2 rounded-full border flex-row items-center"
                style={{
                  backgroundColor: '#E8F1FF',
                  borderColor: '#C7DAFF',
                }}
              >
                <Icon as={EyeIcon} className="text-primary-500 mr-2" />
                <Text className="text-primary-600 text-sm font-semibold">
                  Ver detalhes
                </Text>
              </Box>
            </HStack>
          </VStack>
        </Box>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <Box
      className="rounded-3xl border shadow-soft-1 px-8 py-10 items-center"
      style={{
        backgroundColor: CARD_BACKGROUND_COLOR,
        borderColor: CARD_BORDER_COLOR,
      }}
    >
      <LinearGradient
        colors={HEADER_GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 4,
          width: 96,
          borderRadius: 9999,
          marginBottom: 24,
        }}
      />
      <VStack space="md" className="items-center">
        <Box
          className="h-14 w-14 rounded-2xl items-center justify-center border"
          style={{
            backgroundColor: INFO_CARD_BACKGROUND,
            borderColor: INFO_CARD_BORDER,
          }}
        >
          <Icon as={SettingsIcon} className="text-primary-500" />
        </Box>
        <Heading size="lg" className="text-neutral-900 text-center">
          Nenhum registro encontrado
        </Heading>
        <Text className="text-neutral-500 text-sm text-center">
          {searchText || statusFilter !== 'all'
            ? 'Ajuste os filtros ou a busca para encontrar outros registros.'
            : 'Assim que uma manutenção for registrada, ela aparecerá aqui.'}
        </Text>
        <Box
          className="rounded-full border px-3 py-1"
          style={{
            backgroundColor: EMPTY_BADGE_BACKGROUND,
            borderColor: INFO_CARD_BORDER,
          }}
        >
          <Text
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: EMPTY_BADGE_TEXT }}
          >
            Nenhum item disponível
          </Text>
        </Box>
      </VStack>
    </Box>
  );

  const filteredCount = filteredRecords.length;
  const isAdmin = userProfile?.role === 'admin';
  const headerCategory = isAdmin ? 'Meus equipamentos' : 'Minhas manutenções';
  const headerTitle = isAdmin ? 'Manutenções dos meus equipamentos' : 'Minhas manutenções';
  const headerDescription = isAdmin
    ? 'Veja as intervenções registradas nos equipamentos que você administra e acompanhe suas pendências.'
    : 'Confira todas as manutenções que você registrou em campo e monitore o status de cada ativo.';

  return (
    <Box className="flex-1 bg-background">
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
                {headerCategory}
              </Text>
              <Heading size="3xl" className="text-white font-bold">
                {headerTitle}
              </Heading>
              <Text className="text-white/80 text-sm">
                {headerDescription}
              </Text>
            </VStack>
           
          </VStack>
        </LinearGradient>
      </Box>

      <VStack className="px-6 pt-6" space="lg">

        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: CARD_BACKGROUND_COLOR,
            borderColor: CARD_BORDER_COLOR,
            paddingHorizontal: 18,
            paddingVertical: 18,
          }}
        >
          <VStack space="md">
            <HStack space="sm" className="items-center">
              <Box className="flex-1 relative">
                <Icon
                  as={SearchIcon}
                  className="absolute left-3 top-3 text-neutral-400 z-10"
                />
                <Input className="pl-10 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <InputField
                    placeholder="Buscar registros..."
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                </Input>
              </Box>
              <Pressable disabled>
                <Box className="p-3 bg-neutral-100 border border-neutral-200 rounded-2xl">
                  <Icon as={SettingsIcon} className="text-neutral-400" />
                </Box>
              </Pressable>
            </HStack>

            <HStack space="sm" className="flex-wrap">
              {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
                const isActive = statusFilter === value;
                const meta = value === 'all' ? null : resolveEquipmentStatus(value);
                const activeColors = meta?.badgeColors ?? {
                  backgroundColor: '#E3EEFF',
                  borderColor: '#95BBFF',
                  textColor: '#1D4ED8',
                };

                return (
                  <Pressable key={value} onPress={() => setStatusFilter(value)}>
                    <Box
                      className="px-4 py-2 rounded-full border"
                      style={{
                        backgroundColor: isActive ? activeColors.backgroundColor : '#F6F7FB',
                        borderColor: isActive ? activeColors.borderColor : '#E2E8F0',
                      }}
                    >
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: isActive ? activeColors.textColor : '#475569' }}
                      >
                        {label}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })}
            </HStack>

            <Text className="text-neutral-500 text-sm">
              {filteredCount} registro{filteredCount === 1 ? '' : 's'} encontrado{filteredCount === 1 ? '' : 's'} no critério atual
            </Text>
          </VStack>
        </Box>
      </VStack>

      <Box className="flex-1">
        {loading ? (
          <VStack className="flex-1 justify-center items-center" space="md">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-neutral-500">Carregando registros...</Text>
          </VStack>
        ) : (
          <FlatList
            data={filteredRecords}
            renderItem={renderMaintenanceRecord}
            keyExtractor={(item, index) => item.id || item._id || `record-${index}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={() => (
              <Box className="px-6 py-16">
                {renderEmptyState()}
              </Box>
            )}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 48,
              flexGrow: filteredRecords.length === 0 ? 1 : 0,
            }}
          />
        )}
      </Box>
    </Box>
  );
}
