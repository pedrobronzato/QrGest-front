import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  Icon,
  InfoIcon,
  SearchIcon,
  SettingsIcon
} from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { Equipment } from '@/services/equipment';
import { getCachedEquipments } from '@/services/offlineStorage';
import { resolveEquipmentStatus, resolveEquipmentType } from '@/utils/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const CARD_BORDER_COLOR = '#E0E9FF';
const INFO_CARD_BACKGROUND = '#EEF4FF';
const INFO_CARD_BORDER = '#C7DAFF';
const CACHE_BADGE_BACKGROUND = '#E3EEFF';
const CACHE_BADGE_BORDER = '#95BBFF';
const CACHE_BADGE_TEXT = '#1D4ED8';

const resolveLocationLabel = (location: any): string => {
  if (!location) {
    return 'Localização não informada';
  }

  if (typeof location === 'string') {
    return location;
  }

  return (
    location?.address ||
    location?.name ||
    location?.description ||
    'Localização não informada'
  );
};

export default function SelectEquipmentOfflineScreen() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { userProfile } = useAuthContext();
  const { isOnline } = useConnectivity();

  const loadCachedEquipments = React.useCallback(async () => {
    try {
      setLoading(true);
      
      if (userProfile?.role === 'admin') {
        const cached = await getCachedEquipments();
        
        console.log('📋 Carregando equipamentos offline (Admin):', cached ? `${cached.equipments.length} encontrados` : 'Nenhum cache');
        
        if (cached) {
          console.log('📦 Primeiros equipamentos do cache:');
          cached.equipments.slice(0, 3).forEach((eq: any, i: number) => {
            console.log(`  [${i}] ${eq.name} - id: ${eq.id}, _id: ${eq._id}`);
          });
          
          setEquipments(cached.equipments);
          setFilteredEquipments(cached.equipments);
        } else {
          console.warn('⚠️ Nenhum cache disponível! Usuário deve acessar "Meus Equipamentos" online primeiro.');
          setEquipments([]);
          setFilteredEquipments([]);
        }
      } else {
        const userEquips = userProfile?.equipments || [];
        console.log(`👤 Técnico: ${userEquips.length} equipamentos do perfil`);
        setEquipments(userEquips as any[]);
        setFilteredEquipments(userEquips as any[]);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos do cache:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadCachedEquipments();
   }, [loadCachedEquipments]);

  useEffect(() => {
    let filtered = equipments;

    if (searchText) {
      filtered = filtered.filter(equipment => {
        const name = equipment.name?.toLowerCase() || '';
        const type = equipment.type?.toLowerCase() || '';
        const locationObj = equipment.location as any;
        const location = locationObj?.address?.toLowerCase() || 
                        (typeof locationObj === 'string' ? locationObj.toLowerCase() : '') || '';
        
        return name.includes(searchText.toLowerCase()) ||
               type.includes(searchText.toLowerCase()) ||
               location.includes(searchText.toLowerCase());
      });
    }

    setFilteredEquipments(filtered);
  }, [searchText, equipments]);

  const handleSelectEquipment = (equipment: Equipment) => {
    const eqId = (equipment as any).id;
    const eqMongoId = (equipment as any)._id;
    const equipmentId = eqId || eqMongoId;
    
    const route = `/equipment-maintenance?id=${equipmentId}&fromCache=true`;
    router.push(route as any);
  };

  const renderEquipmentItem = ({ item }: { item: Equipment }) => {
    const equipment = item as any;
    const typeMeta = resolveEquipmentType(equipment.type);
    const statusMeta = resolveEquipmentStatus(equipment.status);
    const typeLabel = typeMeta.label;
    const locationLabel = resolveLocationLabel(equipment.location);
    const statusLabel = statusMeta.label;
    const badgeColors = statusMeta.badgeColors;
    const identifier = equipment.id || equipment._id || equipment.code || '—';
    
    return (
      <Pressable onPress={() => handleSelectEquipment(item)}>
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
          <VStack space="lg" className="p-5">
            <VStack space="md">
              <HStack className="justify-between items-start" space="md">
                <VStack space="xs" className="flex-1">
                  <Text className="text-neutral-500 text-xs uppercase tracking-[3px] font-semibold">
                    {typeLabel}
                  </Text>
                  <Heading size="lg" className="text-neutral-900">
                    {equipment.name || 'Equipamento sem nome'}
                  </Heading>
                </VStack>

                <Box
                  className="rounded-full border"
                  style={{
                    backgroundColor: badgeColors.backgroundColor,
                    borderColor: badgeColors.borderColor,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: badgeColors.textColor }}
                  >
                    {statusLabel}
                  </Text>
                </Box>
              </HStack>

              <VStack space="sm">
                <Text className="text-neutral-600 text-sm">
                  <Text className="font-semibold text-neutral-700">Localização:</Text> {locationLabel}
                </Text>
                <Text className="text-neutral-600 text-sm">
                  <Text className="font-semibold text-neutral-700">Identificador:</Text> {identifier}
                </Text>
              </VStack>
            </VStack>

            <Box
              className="rounded-full border self-start"
              style={{
                backgroundColor: CACHE_BADGE_BACKGROUND,
                borderColor: CACHE_BADGE_BORDER,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Text
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: CACHE_BADGE_TEXT }}
              >
                Dados em cache
              </Text>
            </Box>
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
          Nenhum equipamento disponível
        </Heading>
        <Text className="text-neutral-500 text-sm text-center">
          {searchText
            ? 'Nenhum equipamento corresponde ao filtro aplicado. Ajuste a busca e tente novamente.'
            : 'Conecte-se à internet e sincronize seus dados para carregar os equipamentos no dispositivo.'}
        </Text>
      </VStack>
    </Box>
  );

  const totalEquipments = equipments.length;
  const filteredCount = filteredEquipments.length;

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
                Modo offline
              </Text>
              <Heading size="3xl" className="text-white font-bold">
                Selecionar Equipamento
              </Heading>
              <Text className="text-white/80 text-sm">
                Escolha um equipamento salvo no dispositivo para registrar uma manutenção offline.
              </Text>
            </VStack>

            <HStack
              space="sm"
              className="items-center justify-between bg-white/10 rounded-2xl"
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
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
                  {loading
                    ? 'Carregando cache...'
                    : `${totalEquipments} equipamento${totalEquipments === 1 ? '' : 's'}`}
                </Text>
                <Box className="rounded-full bg-white/20 px-2 py-1">
                  <Text className="text-[10px] text-white/80 font-medium">
                    Cache
                  </Text>
                </Box>
              </HStack>
            </HStack>
          </VStack>
        </LinearGradient>
      </Box>

      <VStack className="px-6 pt-6" space="lg">
        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: INFO_CARD_BACKGROUND,
            borderColor: INFO_CARD_BORDER,
            paddingHorizontal: 18,
            paddingVertical: 18,
          }}
        >
          <HStack space="md" className="items-start">
            <Box
              className="h-10 w-10 rounded-2xl items-center justify-center border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#D8E6FF',
              }}
            >
              <Icon as={InfoIcon} className="text-primary-600" />
            </Box>
            <VStack space="xs" className="flex-1">
              <Heading size="md" className="text-neutral-900">
                Dados em cache
              </Heading>
              <Text className="text-neutral-600 text-sm">
                Selecionar um equipamento iniciará o fluxo de manutenção offline. As alterações serão sincronizadas automaticamente quando a conexão voltar.
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          className="rounded-3xl border shadow-soft-1"
          style={{
            backgroundColor: CARD_BACKGROUND_COLOR,
            borderColor: CARD_BORDER_COLOR,
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
                    placeholder="Buscar equipamento..."
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                </Input>
              </Box>
            </HStack>

            <Text className="text-neutral-500 text-sm">
              {filteredCount} equipamento{filteredCount === 1 ? '' : 's'} disponível{filteredCount === 1 ? '' : 's'} no cache
            </Text>
          </VStack>
        </Box>
      </VStack>

      <Box className="flex-1">
        {loading ? (
          <VStack className="flex-1 justify-center items-center" space="md">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-neutral-500">Carregando equipamentos do cache...</Text>
          </VStack>
        ) : (
          <FlatList
            data={filteredEquipments}
            renderItem={renderEquipmentItem}
            keyExtractor={(item) => (item as any).id || (item as any)._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={loadCachedEquipments}
              />
            }
            ListEmptyComponent={() => (
              <Box className="py-16">
                {renderEmptyState()}
              </Box>
            )}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 48,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

