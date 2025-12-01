import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  AddIcon,
  ArrowLeftIcon,
  EditIcon,
  EyeIcon,
  Icon,
  SearchIcon,
  SettingsIcon,
  TrashIcon
} from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { UserEquipment } from '@/services/auth';
import { Equipment, getEquipments } from '@/services/equipment';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_ORDER,
  EquipmentStatusKey,
  resolveEquipmentStatus,
  resolveEquipmentType,
} from '@/utils/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const ROLE_BADGE_BACKGROUND = '#E0ECFF';
const ROLE_BADGE_TEXT = '#004BCC';
const OFFLINE_BADGE_BACKGROUND = '#FFF4E5';
const OFFLINE_BADGE_TEXT = '#B45309';
const STATUS_FILTERS: { value: 'all' | EquipmentStatusKey; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...EQUIPMENT_STATUS_ORDER.map((key) => ({
    value: key,
    label: EQUIPMENT_STATUS_LABELS[key],
  })),
];

export default function MyEquipmentsScreen() {
  const [equipmentsData, setEquipmentsData] = useState<UserEquipment[] | Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EquipmentStatusKey>('all');
  const [fromCache, setFromCache] = useState(false);
  const { userProfile, fetchUserProfile, idToken } = useAuthContext();
  const { isOnline } = useConnectivity();
  const bottomTabOverflow = useBottomTabOverflow();
  const isAdmin = userProfile?.role === 'admin';
  const totalEquipments = useMemo(() => {
    if (isAdmin) {
      return equipmentsData.length;
    }
    return userProfile?.equipments?.length ?? equipmentsData.length;
  }, [isAdmin, equipmentsData, userProfile?.equipments]);

  const loadEquipments = useCallback(async () => {
    try {
      setLoading(true);
      
      if (userProfile?.role === 'admin') {
        const result = await getEquipments(idToken || undefined, !isOnline);
        if (result.success && result.data) {
          setEquipmentsData(result.data);
          setFromCache(result.fromCache || false);
          
          const { getCachedEquipments } = await import('@/services/offlineStorage');
          const cacheVerify = await getCachedEquipments();
          
          console.log('🔍 Verificação de cache após carregar:', {
            carregados: result.data.length,
            emCache: cacheVerify?.equipments.length || 0,
            fromCache: result.fromCache
          });
        } else {
          if (!isOnline) {
            Alert.alert(
              'Sem Conexão', 
              'Não foi possível carregar equipamentos. Verifique sua conexão.'
            );
          } else {
            Alert.alert('Erro', result.error || 'Erro ao carregar equipamentos');
          }
        }
      } else {
        console.log('👤 Técnico: carregando perfil...');
        await fetchUserProfile(!isOnline);
        setFromCache(!isOnline);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      Alert.alert('Erro', 'Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, idToken, isOnline, userProfile?.role]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipments();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  useEffect(() => {
    if (userProfile?.role === 'tecnico') {
      const equipments = userProfile?.equipments ?? [];
      console.log('equipments', equipments);
      setEquipmentsData(equipments);

      const syncCache = async () => {
        if (!equipments.length) {
          console.warn('⚠️ Técnico sem equipamentos atribuídos');
          return;
        }

        try {
          console.log(`💾 Salvando ${equipments.length} equipamentos do técnico no cache...`);
          const { cacheEquipments, getCachedEquipments } = await import('@/services/offlineStorage');
          const saved = await cacheEquipments(equipments as any);
          console.log(`💾 Equipamentos do técnico salvos no cache? ${saved ? 'SIM ✅' : 'NÃO ❌'}`);

          if (saved) {
            const verify = await getCachedEquipments();
            console.log(`🔍 Verificação: ${verify?.equipments.length || 0} equipamentos em cache`);
          }
        } catch (cacheError) {
          console.warn('⚠️ Erro ao sincronizar cache de equipamentos do técnico', cacheError);
        }
      };

      syncCache();
    }
  }, [userProfile?.equipments, userProfile?.role]);

  const filteredEquipments = useMemo(() => {
    const baseList = (userProfile?.role === 'admin' ? equipmentsData : userProfile?.equipments) ?? equipmentsData;

    const normalizedSearch = searchText.trim().toLowerCase();
    const selectedStatus = statusFilter === 'all' ? null : statusFilter;

    return baseList.filter((equipment: any) => {
      const name = equipment.name?.toLowerCase() || '';
      const type = equipment.type?.toLowerCase() || '';
      const typeMeta = resolveEquipmentType(equipment.type);
      const typeCanonical = typeMeta.canonical;
      const typeTranslated = typeMeta.label.toLowerCase();
      const rawLocation = userProfile?.role === 'admin'
        ? equipment.location?.address ?? equipment.location?.name ?? ''
        : typeof equipment.location === 'string'
          ? equipment.location
          : equipment.location?.address ?? equipment.location?.name ?? '';
      const locationValue = typeof rawLocation === 'string'
        ? rawLocation.toLowerCase()
        : String(rawLocation ?? '').toLowerCase();
      const status = equipment.status?.toLowerCase() || '';
      const statusMeta = resolveEquipmentStatus(equipment.status);
      const statusCanonical = statusMeta.canonical;
      const statusTranslated = statusMeta.label.toLowerCase();

      const matchesSearch = !normalizedSearch
        || name.includes(normalizedSearch)
        || type.includes(normalizedSearch)
        || (typeCanonical ? typeCanonical.includes(normalizedSearch) : false)
        || typeTranslated.includes(normalizedSearch)
        || locationValue.includes(normalizedSearch)
        || status.includes(normalizedSearch)
        || (statusCanonical ? statusCanonical.includes(normalizedSearch) : false)
        || statusTranslated.includes(normalizedSearch);

      const matchesStatus =
        !selectedStatus
        || statusCanonical === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [equipmentsData, userProfile?.equipments, userProfile?.role, searchText, statusFilter]);

  const handleEditEquipment = (equipment: UserEquipment | Equipment) => {
    const equipmentId = (equipment as any).id || (equipment as any)._id;

    router.push(
      `/equipment-maintenance?id=${equipmentId}` as any,
    );
  };

  const handleViewEquipment = (equipment: UserEquipment | Equipment) => {
    const equipmentId = (equipment as any).id || (equipment as any)._id;
    router.push(`/equipment-details?id=${equipmentId}`);
  };

  const handleDeleteEquipment = (equipment: UserEquipment | Equipment) => {
    const equipmentName = equipment.name;
    const equipmentId = (equipment as any).id || (equipment as any)._id;
    Alert.alert(
      'Excluir Equipamento',
      `Tem certeza que deseja excluir o equipamento "${equipmentName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            console.log('Excluir equipamento:', equipmentId);
          },
        },
      ],
    );
  };

  const handleAssignTechnician = (equipment: UserEquipment | Equipment) => {
    const equipmentId = (equipment as any).id || (equipment as any)._id;
    router.push(`/assign-technician?equipmentId=${equipmentId}&equipmentName=${encodeURIComponent(equipment.name)}` as any);
  };

  const renderEquipmentItem = ({ item }: { item: UserEquipment | Equipment }) => {
    const equipment = item as any;
    const typeMeta = resolveEquipmentType(equipment.type);
    const typeLabel = typeMeta.label;
    const statusMeta = resolveEquipmentStatus(equipment.status);
    const locationLabel = isAdmin
      ? equipment.location?.address
          || equipment.location?.name
          || 'Localização não informada'
      : typeof equipment.location === 'string'
          ? equipment.location
          : equipment.location?.address
            || equipment.location?.name
            || 'Localização não informada';
    const installationDate = equipment.installationDate
      ? new Date(equipment.installationDate).toLocaleDateString('pt-BR')
      : '—';
    const assignedAt = equipment.assignedAt
      ? new Date(equipment.assignedAt).toLocaleDateString('pt-BR')
      : null;
    const statusLabel = statusMeta.label;
    const statusClasses = statusMeta.badgeClasses;
    console.log('equipment', equipment);
    console.log('equipment.onlyOnSiteMaintenance', equipment.onlyOnSiteMaintenance);
    const canRegisterMaintenance = !equipment.onlyOnSiteMaintenance;
    
    return (
      <Box
        key={equipment.id || equipment._id}
        className="rounded-3xl border shadow-soft-1 overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E0E9FF',
          marginBottom: 24,
        }}
      >
        <LinearGradient
          colors={HEADER_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 4, width: '100%' }}
        />
        <VStack space="lg" className="p-5">
          <VStack space="md">
            <HStack className="justify-between items-start" space="md">
              <VStack className="flex-1" space="xs">
                <Heading size="lg" className="text-neutral-900">
                  {equipment.name || 'Equipamento sem nome'}
                </Heading>
                <Text className="text-neutral-500 text-sm">
                  {typeLabel}
                </Text>
              </VStack>

              <Box className={`px-3 py-1 rounded-full ${statusClasses.container}`}>
                <Text className={`text-[11px] font-semibold uppercase tracking-wide ${statusClasses.text}`}>
                  {statusLabel}
                </Text>
              </Box>
            </HStack>

            <VStack space="sm">
              <Text className="text-neutral-600 text-sm">
                <Text className="font-semibold text-neutral-700">Localização:</Text> {locationLabel}
              </Text>
              <Text className="text-neutral-600 text-sm">
                <Text className="font-semibold text-neutral-700">Instalação:</Text> {installationDate}
              </Text>
              {!isAdmin && assignedAt && (
                <Text className="text-neutral-600 text-sm">
                  <Text className="font-semibold text-neutral-700">Associado em:</Text> {assignedAt}
                </Text>
              )}
            </VStack>
          </VStack>

          <HStack className="justify-end" space="sm">
            <Pressable onPress={() => handleViewEquipment(item)}>
              <Box className="p-3 rounded-2xl bg-blue-100">
                <Icon as={EyeIcon} className="text-blue-600" />
              </Box>
            </Pressable>
              {console.log('canRegisterMaintenance', canRegisterMaintenance)}
            {canRegisterMaintenance && (
              <Pressable onPress={() => handleEditEquipment(item)}>
                <Box className="p-3 rounded-2xl bg-yellow-100">
                  <Icon as={EditIcon} className="text-yellow-600" />
                </Box>
              </Pressable>
            )}

            {isAdmin && (
              <Pressable onPress={() => handleAssignTechnician(item)}>
                <Box className="p-3 rounded-2xl bg-green-100">
                  <Icon as={AddIcon} className="text-green-600" />
                </Box>
              </Pressable>
            )}

            {isAdmin && (
              <Pressable onPress={() => handleDeleteEquipment(item)}>
                <Box className="p-3 rounded-2xl bg-red-100">
                  <Icon as={TrashIcon} className="text-red-600" />
                </Box>
              </Pressable>
            )}
          </HStack>
        </VStack>
      </Box>
    );
  };

  const renderEmptyState = () => (
    <Box
      className="rounded-3xl border shadow-soft-1 px-8 py-10"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E9FF',
      }}
    >
      <VStack space="lg" className="items-center">
        <Box
          className="rounded-full p-5"
          style={{ backgroundColor: '#E3EEFF' }}
        >
          <Icon as={SettingsIcon} className="w-10 h-10" style={{ color: '#004BCC' }} />
        </Box>
        <VStack space="sm">
          <Heading size="lg" className="text-neutral-900 text-center">
            Nenhum equipamento encontrado
          </Heading>
          <Text className="text-neutral-500 text-sm text-center">
            {searchText || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca para ampliar os resultados.'
              : isAdmin
                ? 'Cadastre novos equipamentos para começar a gerenciar seu inventário.'
                : 'Você ainda não possui equipamentos associados ao seu usuário.'}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );

  const getScreenTitle = () => {
    return userProfile?.role === 'admin' ? 'Gerenciar Equipamentos' : 'Meus Equipamentos';
  };

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
            paddingBottom: 24,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <VStack space="md">
            <HStack className="items-center justify-between">
              <Pressable onPress={() => router.back()} className="bg-white/10 p-2 rounded-full">
                <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
              </Pressable>
              <Box className="w-10" />
            </HStack>

            <VStack space="xs">
              <Text className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                {isAdmin ? 'Gestão de ativos' : 'Suas designações'}
              </Text>
              <Heading size="3xl" className="text-white font-bold">
                {getScreenTitle()}
              </Heading>
              <HStack space="sm" className="items-center">
                <Box
                  className="rounded-full"
                  style={{
                    backgroundColor: ROLE_BADGE_BACKGROUND,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text className="text-xs font-semibold uppercase" style={{ color: ROLE_BADGE_TEXT }}>
                    {isAdmin ? 'Administrador' : 'Técnico'}
                  </Text>
                </Box>
                {!isOnline && (
                  <Box
                    className="rounded-full"
                    style={{
                      backgroundColor: OFFLINE_BADGE_BACKGROUND,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text className="text-xs font-semibold uppercase" style={{ color: OFFLINE_BADGE_TEXT }}>
                      Modo offline
                    </Text>
                  </Box>
                )}
              </HStack>
            </VStack>

            <HStack
              space="sm"
              className="items-center justify-between bg-white/10 rounded-2xl"
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <HStack space="sm" className="items-center">
                <Box
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isOnline ? '#22C55E' : '#F97316' }}
                />
                <Text className="text-white text-sm font-medium">
                  {isOnline ? 'Online' : 'Modo offline'}
                </Text>
              </HStack>

              <HStack space="sm" className="items-center">
                <Text className="text-white/90 text-xs font-semibold uppercase">
                  {totalEquipments} equipamento{totalEquipments === 1 ? '' : 's'}
                </Text>
                {fromCache && (
                  <Box className="rounded-full bg-white/20 px-2 py-1">
                    <Text className="text-[10px] text-white/80 font-medium">
                      Cache
                    </Text>
                  </Box>
                )}
              </HStack>
            </HStack>
          </VStack>
        </LinearGradient>
      </Box>

      <VStack className="px-6 pt-6" space="md">
        {!isOnline && fromCache && (
          <Box className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Text className="text-blue-800 text-sm text-center font-medium">
              📦 Exibindo dados salvos no dispositivo. Conecte-se para sincronizar novas informações.
            </Text>
          </Box>
        )}

        <Box
          className="rounded-3xl shadow-soft-1 border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#B3CDFF',
            paddingHorizontal: 16,
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
                    placeholder="Buscar equipamentos..."
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                </Input>
              </Box>
            </HStack>

            <HStack space="sm" className="flex-wrap">
              {STATUS_FILTERS.map(({ value, label }) => {
                const isActive = statusFilter === value;
                const meta = value === 'all' ? null : resolveEquipmentStatus(value);
                const activeColors = meta?.badgeColors ?? {
                  backgroundColor: '#E3EEFF',
                  borderColor: '#95BBFF',
                  textColor: '#004BCC',
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
              {filteredEquipments.length} equipamento{filteredEquipments.length !== 1 ? 's' : ''} encontrado{filteredEquipments.length !== 1 ? 's' : ''}
            </Text>
          </VStack>
        </Box>
      </VStack>

      <Box className="flex-1">
        {loading ? (
          <VStack className="flex-1 justify-center items-center" space="md">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-neutral-500">Carregando equipamentos...</Text>
          </VStack>
        ) : (
          <FlatList
            data={filteredEquipments}
            renderItem={renderEquipmentItem}
            keyExtractor={(item) => (item as any).id || (item as any)._id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={() => (
              <Box className="py-16">
                {renderEmptyState()}
              </Box>
            )}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: bottomTabOverflow + 48,
            }}
          />
        )}
      </Box>
    </Box>
  );
} 