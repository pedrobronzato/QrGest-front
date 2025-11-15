import { GradientTitle } from '@/components/GradientTitle';
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
import { ActivityIndicator, Alert, Image, ScrollView } from 'react-native';

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
      <Box className="flex-1 bg-white justify-center items-center">
        <VStack space="2xl" className="items-center">
          <VStack space="lg" className="items-center">
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 120, height: 120, borderRadius: 30 }}
            />
            <GradientTitle>QrGest</GradientTitle>
          </VStack>

          <VStack space="sm" className="items-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-gray-600">
              {retryingProfile ? 'Recarregando seus dados...' : 'Preparando sua conta...'}
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: bottomTabOverflow + 32 }}
          showsVerticalScrollIndicator={false}
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
                <VStack space="xs">
                  <Text className="text-white/70 text-xs uppercase tracking-widest font-semibold">
                    Painel principal
                  </Text>
                  <Heading size="3xl" className="text-white font-bold">
                    Início
                  </Heading>
                </VStack>

                <HStack space="sm" className="items-center">
                  <Box
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: isOnline ? ONLINE_INDICATOR_COLOR : OFFLINE_INDICATOR_COLOR,
                    }}
                  />
                  <Text className="text-white text-sm font-medium">
                    {isOnline ? 'Online' : 'Modo Offline'}
                  </Text>
                </HStack>
              </VStack>
            </LinearGradient>
          </Box>

          <VStack className="px-6 mt-6" space="lg">
            <Box
              className="rounded-3xl border shadow-soft-1"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E0E9FF',
                paddingHorizontal: 24,
                paddingVertical: 28,
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
                  marginBottom: 20,
                }}
              />

              <VStack space="lg" className="items-center">
                <Box
                  className="rounded-full p-5"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Icon as={InfoIcon} className="text-red-600" size="lg" />
                </Box>

                <VStack space="sm" className="items-center">
                  <Heading size="lg" className="text-neutral-900 text-center">
                    Não foi possível carregar seus dados
                  </Heading>
                  <Text className="text-neutral-600 text-center">
                    Encontramos um problema ao carregar as informações da sua conta. Tente novamente para continuar.
                  </Text>
                </VStack>

                {!isOnline ? (
                  <Box
                    className="rounded-2xl border px-4 py-4 w-full"
                    style={{
                      backgroundColor: '#FFF4E5',
                      borderColor: '#FED7AA',
                    }}
                  >
                    <HStack space="sm" className="items-start">
                      <Icon as={InfoIcon} className="text-orange-500" size="sm" />
                      <Text className="text-orange-700 text-sm flex-1">
                        Você está offline. Conecte-se à internet para sincronizar os dados mais recentes.
                      </Text>
                    </HStack>
                  </Box>
                ) : (
                  <Text className="text-neutral-500 text-sm text-center">
                    Pode ser um problema temporário de conexão ou do servidor.
                  </Text>
                )}

                <VStack space="sm" className="w-full">
                  <Button
                    onPress={handleRetryProfile}
                    className="bg-primary-600"
                    isDisabled={!isOnline}
                  >
                    <HStack space="sm" className="items-center justify-center">
                      <Icon as={InfoIcon} className="text-white" size="sm" />
                      <ButtonText className="text-white font-semibold">
                        Tentar novamente
                      </ButtonText>
                    </HStack>
                  </Button>

                  <Button
                    onPress={handleLogout}
                    variant="outline"
                    className="border-gray-300 bg-white"
                  >
                    <ButtonText className="text-gray-700">
                      Sair e fazer login novamente
                    </ButtonText>
                  </Button>
                </VStack>

                <Text className="text-blue-600 text-xs text-center">
                  💡 Se o problema persistir, finalize a sessão e tente novamente mais tarde.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  if (userProfile.role === 'tecnico' && (!userProfile.equipments || userProfile.equipments.length === 0)) {
    return (
      <Box className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: bottomTabOverflow + 32 }}
          showsVerticalScrollIndicator={false}
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
                <VStack space="xs">
                  <Text className="text-white/70 text-xs uppercase tracking-widest font-semibold">
                    Painel principal
                  </Text>
                  <Heading size="3xl" className="text-white font-bold">
                    Início
                  </Heading>
                </VStack>

                <HStack space="sm" className="items-center">
                  <Box
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: isOnline ? ONLINE_INDICATOR_COLOR : OFFLINE_INDICATOR_COLOR,
                    }}
                  />
                  <Text className="text-white text-sm font-medium">
                    {isOnline ? 'Online' : 'Modo Offline'}
                  </Text>
                </HStack>
              </VStack>
            </LinearGradient>
          </Box>

          <VStack className="px-6 mt-6" space="lg">
            <VStack space="xs">
              <Heading size="xl" className="text-neutral-900">
                Bem-vindo, {userProfile.name}
              </Heading>
              <Text className="text-neutral-500 text-sm">
                Assim que um administrador associar equipamentos ao seu usuário, eles aparecerão aqui.
              </Text>
            </VStack>

            <Box
              className="rounded-3xl border shadow-soft-1"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#FFE8B4',
                paddingHorizontal: 24,
                paddingVertical: 28,
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
                  marginBottom: 20,
                }}
              />

              <VStack space="lg" className="items-center">
                <Box
                  className="rounded-full p-5"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Icon as={SettingsIcon} className="text-amber-500" size="lg" />
                </Box>

                <VStack space="sm" className="items-center">
                  <Heading size="lg" className="text-neutral-900 text-center">
                    Nenhum equipamento associado
                  </Heading>
                  <Text className="text-neutral-600 text-center">
                    Você ainda não possui equipamentos atribuídos. Solicite ao administrador que vincule os ativos necessários ao seu perfil.
                  </Text>
                </VStack>

                {!isOnline && (
                  <Box
                    className="rounded-2xl border px-4 py-4 w-full"
                    style={{
                      backgroundColor: '#FFF4E5',
                      borderColor: '#FED7AA',
                    }}
                  >
                    <HStack space="sm" className="items-start">
                      <Icon as={InfoIcon} className="text-orange-500" size="sm" />
                      <Text className="text-orange-700 text-sm flex-1">
                        Você está offline. Ao receber uma designação, conecte-se para sincronizar e visualizar os equipamentos.
                      </Text>
                    </HStack>
                  </Box>
                )}

                <VStack space="sm" className="w-full">
                  <Button
                    onPress={handleRetryProfile}
                    className="bg-primary-600"
                    isDisabled={!isOnline}
                  >
                    <HStack space="sm" className="items-center justify-center">
                      <Icon as={InfoIcon} className="text-white" size="sm" />
                      <ButtonText className="text-white font-semibold">
                        Atualizar dados
                      </ButtonText>
                    </HStack>
                  </Button>

                  <Button
                    onPress={handleMyEquipments}
                    variant="outline"
                    className="border-gray-300 bg-white"
                  >
                    <ButtonText className="text-gray-700">
                      Abrir Meus Equipamentos
                    </ButtonText>
                  </Button>
                </VStack>

                <Text className="text-neutral-400 text-xs text-center">
                  Em caso de dúvida, procure o administrador responsável pela sua equipe.
                </Text>
              </VStack>
            </Box>

            <HStack className="justify-center pb-10">
              <Button onPress={handleLogout} variant="outline" className="border-gray-300 bg-white px-6">
                <ButtonText className="text-gray-600">Sair da conta</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
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
