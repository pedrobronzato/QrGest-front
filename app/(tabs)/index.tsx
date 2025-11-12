import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  AddIcon,
  ArrowRightIcon,
  Icon,
  InfoIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon
} from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { logoutUser } from '@/services/auth';
import { getPendingSyncCount } from '@/services/syncService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ElementType } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';

type ActionAccent = 'primary' | 'success' | 'neutral';
type BadgeAccent = 'primary' | 'success' | 'neutral';

type ActionCardConfig = {
  title: string;
  description?: string;
  icon: ElementType;
  onPress: () => void;
  accent?: ActionAccent;
  disabled?: boolean;
  badge?: {
    label: string;
    accent?: BadgeAccent;
  };
};

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const HEADER_CARD_BACKGROUND = 'rgba(255, 255, 255, 0.12)';
const HEADER_CARD_BORDER_COLOR = 'rgba(255, 255, 255, 0.28)';
const HEADER_PILL_BACKGROUND = 'rgba(255, 255, 255, 0.22)';
const ONLINE_INDICATOR_COLOR = '#00D26A';
const OFFLINE_INDICATOR_COLOR = '#F97316';
const ROLE_BADGE_BACKGROUND = '#E0ECFF';
const ROLE_BADGE_TEXT = '#004BCC';
const OFFLINE_BADGE_BACKGROUND = '#FFF4E5';
const OFFLINE_BADGE_TEXT = '#B45309';

const ACCENT_STYLES: Record<ActionAccent, { container: string; icon: string; border: string }> = {
  primary: {
    container: 'bg-primary-100',
    icon: 'text-primary-600',
    border: 'border-primary-200',
  },
  success: {
    container: 'bg-success-100',
    icon: 'text-success-600',
    border: 'border-success-200',
  },
  neutral: {
    container: 'bg-neutral-100',
    icon: 'text-neutral-600',
    border: 'border-neutral-200',
  },
};

const BADGE_STYLES: Record<BadgeAccent, string> = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export default function HomeScreen() {
  const { userProfile, profileLoading, fetchUserProfile } = useAuthContext();
  const { isOnline } = useConnectivity();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [retryingProfile, setRetryingProfile] = useState(false);
  const bottomTabOverflow = useBottomTabOverflow();

  useEffect(() => {
    const checkPendingSync = async () => {
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
    };

    checkPendingSync();
    
    const interval = setInterval(checkPendingSync, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryProfile = async () => {
    if (!isOnline) {
      Alert.alert(
        'Sem Conexão',
        'Você precisa estar online para recarregar os dados. Verifique sua conexão e tente novamente.'
      );
      return;
    }

    setRetryingProfile(true);
    try {
      await fetchUserProfile(false);
      
      if (userProfile) {
        Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao recarregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível recarregar os dados. Tente novamente.');
    } finally {
      setRetryingProfile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            await logoutUser();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleQRScan = () => {
    router.push('/scan-qr' as any);
  };

  const handleMyEquipments = () => {
    router.push('/my-equipments' as any);
  };

  const handleOfflineMaintenance = () => {
    router.push('/select-equipment-offline' as any);
  };

  const handleRegisterEquipment = () => {
    router.push('/register-equipment' as any);
  };

  const handleReports = () => {
    router.push('/maintenance-reports' as any);
  };

  const renderActionCard = ({
    title,
    description,
    icon,
    onPress,
    accent = 'primary',
    disabled = false,
    badge,
  }: ActionCardConfig) => {
    const accentStyle = ACCENT_STYLES[accent];
    const badgeAccent = badge?.accent ?? 'neutral';
    const badgeStyle = badge ? BADGE_STYLES[badgeAccent] : undefined;

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`active:scale-[0.98] ${disabled ? 'opacity-60' : ''}`}
      >
        <Box
          className={`rounded-2xl bg-white p-5 shadow-soft-1 border ${accentStyle.border}`}
        >
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Box
                className={`h-12 w-12 items-center justify-center rounded-full ${accentStyle.container}`}
              >
                <Icon as={icon} className={`${accentStyle.icon}`} size="lg" />
              </Box>
              <VStack className="flex-1">
                <Text className="text-neutral-900 text-lg font-semibold">
                  {title}
                </Text>
                {description ? (
                  <Text className="text-neutral-600 text-xs mt-1 leading-4">
                    {description}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
            <HStack space="sm" className="items-center">
              {badge && badgeStyle ? (
                <Box className={`rounded-full px-2 py-1 ${badgeStyle}`}>
                  <Text className="text-xs font-medium">{badge.label}</Text>
                </Box>
              ) : null}
              <Icon as={ArrowRightIcon} className="text-neutral-400" size="sm" />
            </HStack>
          </HStack>
        </Box>
      </Pressable>
    );
  };

  if (profileLoading || retryingProfile) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <VStack space="md" className="items-center">
          <ActivityIndicator size="large" color="#22C55E" />
          <Text className="text-gray-600">
            {retryingProfile ? 'Recarregando dados...' : 'Carregando...'}
          </Text>
        </VStack>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box className="flex-1 bg-background">
        <Box className="bg-primary-500 pt-20 pb-6 px-6">
          <Heading size="2xl" className="text-white text-center font-bold">
            QrGest
          </Heading>
          
          <HStack className="mt-3 justify-center items-center" space="sm">
            <Box 
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
            />
            <Text className="text-white text-sm">
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </HStack>
        </Box>

        <Box className="flex-1 justify-center items-center px-6">
          <VStack space="xl" className="items-center max-w-md">
            <Box className="bg-red-100 p-6 rounded-full">
              <Icon as={InfoIcon} className="text-red-600" size="xl" />
            </Box>

            <Heading size="xl" className="text-gray-800 text-center">
              Erro ao Carregar Dados
            </Heading>

            <VStack space="md" className="items-center">
              <Text className="text-gray-600 text-center text-base">
                Não foi possível carregar seus dados do usuário.
              </Text>
              
              {!isOnline && (
                <Box className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <HStack space="sm" className="items-start">
                    <Text className="text-orange-600">⚠️</Text>
                    <Text className="text-orange-700 text-sm flex-1">
                      Você está offline. Conecte-se à internet para carregar seus dados.
                    </Text>
                  </HStack>
                </Box>
              )}

              {isOnline && (
                <Text className="text-gray-500 text-center text-sm">
                  Pode ser um problema temporário de conexão ou servidor.
                </Text>
              )}
            </VStack>

            <VStack space="md" className="w-full">
              <Button 
                onPress={handleRetryProfile}
                className="bg-primary-600 w-full"
                isDisabled={!isOnline}
              >
                <HStack space="sm" className="items-center">
                  <Icon as={InfoIcon} className="text-white" size="sm" />
                  <ButtonText className="text-white font-semibold">
                    Tentar Novamente
                  </ButtonText>
                </HStack>
              </Button>

              <Button 
                onPress={handleLogout}
                className="bg-gray-200 w-full"
                variant="outline"
              >
                <ButtonText className="text-gray-700">
                  Sair e Fazer Login Novamente
                </ButtonText>
              </Button>
            </VStack>

            <Box className="bg-blue-50 p-4 rounded-lg border border-blue-200 w-full">
              <Text className="text-blue-700 text-xs text-center">
                💡 Se o problema persistir, tente fazer logout e login novamente.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (userProfile.role === 'tecnico' && (!userProfile.equipments || userProfile.equipments.length === 0)) {
    return (
      <Box className="flex-1 bg-background">
        <Box className="bg-primary-500 pt-20 pb-6 px-6">
          <Heading size="2xl" className="text-white text-center font-bold">
            Início
          </Heading>
        </Box>

        <VStack className="flex-1 px-6 mt-6" space="lg">
          <VStack space="sm">
            <Heading size="3xl" className="text-gray-800">
              Bem-vindo, {userProfile.name}
            </Heading>
          </VStack>

          <Box className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <VStack space="md" className="items-center">
              <Text className="text-yellow-600 text-4xl">⚠️</Text>
              <Heading size="lg" className="text-yellow-800 text-center">
                Nenhum Equipamento Associado
              </Heading>
              <Text className="text-yellow-700 text-center">
                Você ainda não foi associado a nenhum equipamento. 
                Entre em contato com o administrador para ser designado a equipamentos.
              </Text>
            </VStack>
          </Box>

          <HStack className="justify-center items-center pt-6 pb-8">
            <Button onPress={handleLogout} className="bg-white border border-gray-300">
              <ButtonText className="text-gray-600">Sair</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background">
      <Box className="overflow-hidden">
        <LinearGradient
          colors={HEADER_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: '100%',
            paddingTop: 50,
            paddingBottom: 40,
            paddingHorizontal: 24,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <VStack space="lg">
            <VStack space="xs">
              <Text className="text-white/70 text-xs uppercase tracking-widest font-semibold">
                Painel principal
              </Text>
              <Heading size="3xl" className="text-white font-bold">
                Início
              </Heading>
            </VStack>

            <Box
              className="rounded-3xl"
              style={{
                backgroundColor: HEADER_CARD_BACKGROUND,
                borderColor: HEADER_CARD_BORDER_COLOR,
                borderWidth: 1,
                paddingHorizontal: 20,
                paddingVertical: 18,
              }}
            >
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <HStack space="sm" className="items-center">
                    <Box
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: isOnline
                          ? ONLINE_INDICATOR_COLOR
                          : OFFLINE_INDICATOR_COLOR,
                      }}
                    />
                    <Text className="text-white text-base font-semibold">
                      {isOnline ? 'Online' : 'Modo Offline'}
                    </Text>
                  </HStack>

                  <Box
                    className="rounded-full"
                    style={{
                      backgroundColor: HEADER_PILL_BACKGROUND,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text className="text-white text-xs font-medium uppercase">
                      {pendingSyncCount > 0
                        ? `${pendingSyncCount} pendentes`
                        : 'Sincronizado'}
                    </Text>
                  </Box>
                </HStack>

                <Text className="text-white/80 text-xs leading-5">
                  {isOnline
                    ? 'Você está conectado e as novas manutenções serão sincronizadas automaticamente.'
                    : 'Continue registrando normalmente; as manutenções serão sincronizadas assim que a conexão retornar.'}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </LinearGradient>
      </Box>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomTabOverflow + 32 }}
      >
        <VStack className="px-6 mt-6 pb-6" space="lg">
        <Box
          className="rounded-3xl shadow-soft-1 border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#B3CDFF',
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
          <Text className="text-primary-600 text-xs uppercase font-semibold">
            Bem-vindo de volta
          </Text>
          <Heading size="2xl" className="text-neutral-900 font-bold mt-2">
            {userProfile.name}
          </Heading>
          <HStack space="sm" className="items-center mt-3">
            <Box
              className="rounded-full"
              style={{
                backgroundColor: ROLE_BADGE_BACKGROUND,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text className="text-xs font-semibold uppercase" style={{ color: ROLE_BADGE_TEXT }}>
                {userProfile.role === 'admin' ? 'Administrador' : 'Técnico'}
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
          <Text className="text-neutral-600 text-sm mt-4">
            {userProfile.role === 'admin'
              ? 'Gerencie sua operação e acompanhe as atividades da equipe em tempo real.'
              : 'Organize suas visitas e mantenha as manutenções em dia com o apoio do QrGest.'}
          </Text>
        </Box>


        {!isOnline && (
          <Box className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
            <VStack space="sm">
              <Text className="text-orange-800 font-semibold">
                📴 Modo Offline Ativado
              </Text>
              <Text className="text-orange-700 text-sm">
                Apenas &quot;Meus Equipamentos&quot; e &quot;Escanear QR Code&quot; estão disponíveis. 
                Você pode realizar manutenções que serão sincronizadas quando voltar online.
              </Text>
            </VStack>
          </Box>
        )}

        <VStack space="lg">
          <VStack space="xs">
            <Heading size="lg" className="text-neutral-900">
              Acesso rápido
            </Heading>
            <Text className="text-neutral-600 text-sm">
              Escolha uma ação principal para continuar
            </Text>
          </VStack>

          <VStack space="md">
            {renderActionCard({
              title: 'Escanear QR Code',
              description: 'Disponível offline',
              icon: SearchIcon,
              onPress: handleQRScan,
              accent: 'primary',
              badge: !isOnline ? { label: 'Offline', accent: 'neutral' } : undefined,
            })}

            {renderActionCard({
              title: userProfile.role === 'tecnico' ? 'Meus Equipamentos' : 'Gerenciar Equipamentos',
              description:
                userProfile.role === 'tecnico'
                  ? 'Visualize os ativos vinculados ao seu usuário'
                  : 'Administre o inventário e as associações dos técnicos',
              icon: MenuIcon,
              onPress: handleMyEquipments,
              accent: 'primary',
              badge:
                pendingSyncCount > 0
                  ? { label: `${pendingSyncCount} pendentes`, accent: 'primary' }
                  : undefined,
            })}

            {!isOnline &&
              renderActionCard({
                title: 'Registrar Manutenção Offline',
                description: 'Use os equipamentos salvos no dispositivo para registrar novas intervenções',
                icon: SettingsIcon,
                onPress: handleOfflineMaintenance,
                accent: 'success',
                badge:
                  pendingSyncCount > 0
                    ? { label: `${pendingSyncCount} pendentes`, accent: 'success' }
                    : undefined,
              })}

            {isOnline &&
              userProfile.role === 'admin' &&
              renderActionCard({
                title: 'Cadastrar Equipamento',
                description: 'Inclua novos equipamentos e distribua para a equipe',
                icon: AddIcon,
                onPress: handleRegisterEquipment,
                accent: 'primary',
              })}

            {isOnline &&
              renderActionCard({
                title: 'Relatórios',
                description: 'Acompanhe indicadores e histórico de manutenção',
                icon: InfoIcon,
                onPress: handleReports,
                accent: 'neutral',
              })}
          </VStack>
        </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
