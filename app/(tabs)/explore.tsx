import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ElementType } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';

import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  CalendarDaysIcon,
  Icon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { logoutUser } from '@/services/auth';

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

type InfoAccent = 'primary' | 'success' | 'neutral';

type InfoItem = {
  label: string;
  value: string;
  icon: ElementType;
  accent: InfoAccent;
};

const INFO_ACCENT_STYLES: Record<InfoAccent, { backgroundColor: string; borderColor: string; iconClassName: string }> = {
  primary: {
    backgroundColor: 'rgba(0, 93, 255, 0.12)',
    borderColor: 'rgba(0, 93, 255, 0.24)',
    iconClassName: 'text-primary-600',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.24)',
    iconClassName: 'text-success-600',
  },
  neutral: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderColor: 'rgba(15, 23, 42, 0.16)',
    iconClassName: 'text-neutral-600',
  },
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'tecnico':
      return 'Técnico';
    default:
      return role;
  }
};

const getInitials = (name: string) => {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  );
};

export default function ProfileScreen() {
  const { user, userProfile, profileLoading } = useAuthContext();
  const { isOnline } = useConnectivity();
  const bottomTabOverflow = useBottomTabOverflow();

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const result = await logoutUser();
            if (result.success) {
              router.replace('/login');
            } else {
              Alert.alert('Erro', result.error || 'Erro ao fazer logout');
            }
          },
        },
      ],
    );
  };

  if (profileLoading) {
    return (
      <Box className="flex-1 bg-background justify-center items-center">
        <VStack space="md" className="items-center">
          <ActivityIndicator size="large" color="#22C55E" />
          <Text className="text-gray-600">Carregando perfil...</Text>
        </VStack>
      </Box>
    );
  }

  const profileName = userProfile?.name || user?.displayName || 'Usuário';
  const profileEmail = userProfile?.email || user?.email || 'Não informado';
  const role = getRoleDisplayName(userProfile?.role || 'Usuário');
  const equipmentCount = userProfile?.equipments?.length ?? 0;
  const memberSinceDate = userProfile?.createdAt ? new Date(userProfile.createdAt) : undefined;
  const memberSince = memberSinceDate && !Number.isNaN(memberSinceDate.getTime())
    ? memberSinceDate.toLocaleDateString('pt-BR')
    : 'Não informado';


  const detailItems: InfoItem[] = [
    {
      label: 'E-mail',
      value: profileEmail,
      icon: MailIcon,
      accent: 'primary',
    },
    {
      label: 'Telefone',
      value: userProfile?.phone || 'Não informado',
      icon: PhoneIcon,
      accent: 'primary',
    },
    {
      label: 'Membro desde',
      value: memberSince,
      icon: CalendarDaysIcon,
      accent: 'neutral',
    },
    {
      label: 'Equipamentos ativos',
      value:
        equipmentCount > 0
          ? `${equipmentCount} equipamento(s)`
          : 'Nenhum equipamento associado',
      icon: SettingsIcon,
      accent: equipmentCount > 0 ? 'success' : 'neutral',
    },
  ];

  return (
    <Box className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomTabOverflow + 32 }}
      >
        <Box className="overflow-hidden">
          <LinearGradient
            colors={HEADER_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: '100%',
              paddingTop: 50,
              paddingBottom: 20,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
            }}
          >
            <VStack space="lg">
              <VStack space="xs">
                <Text className="text-white/70 text-xs uppercase tracking-widest font-semibold">
                  Configurações
                </Text>
                <Heading size="3xl" className="text-white font-bold">
                  Perfil
                </Heading>
              </VStack>
            </VStack>
          </LinearGradient>
        </Box>

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

            <HStack space="lg" className="items-center">
              <Box
                className="h-16 w-16 rounded-2xl overflow-hidden border"
                style={{ borderColor: '#D4E3FF' }}
              >
                <LinearGradient
                  colors={HEADER_GRADIENT_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white text-2xl font-bold">
                    {getInitials(profileName)}
                  </Text>
                </LinearGradient>
              </Box>

              <VStack space="xs" className="flex-1">
                <Heading size="xl" className="text-neutral-900 font-bold">
                  {profileName}
                </Heading>
                <Text className="text-neutral-600 text-sm">
                  {profileEmail}
                </Text>

                <HStack space="sm" className="items-center mt-2">
                  <Box
                    className="rounded-full"
                    style={{
                      backgroundColor: ROLE_BADGE_BACKGROUND,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold uppercase"
                      style={{ color: ROLE_BADGE_TEXT }}
                    >
                      {role}
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
                      <Text
                        className="text-xs font-semibold uppercase"
                        style={{ color: OFFLINE_BADGE_TEXT }}
                      >
                        Modo offline
                      </Text>
                    </Box>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </Box>

          <Box
            className="rounded-3xl shadow-soft-1 border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              paddingHorizontal: 20,
              paddingVertical: 24,
            }}
          >
            <VStack space="lg">
              <VStack space="xs">
                <HStack space="sm" className="items-center">
                  <Box
                    className="h-10 w-10 rounded-2xl items-center justify-center border"
                    style={{
                      backgroundColor: 'rgba(0, 93, 255, 0.1)',
                      borderColor: 'rgba(0, 93, 255, 0.18)',
                    }}
                  >
                    <Icon as={UserIcon} className="text-primary-600" size="md" />
                  </Box>
                  <Heading size="lg" className="text-neutral-900">
                    Informações do perfil
                  </Heading>
                </HStack>
                <Text className="text-neutral-600 text-sm">
                  Confira os dados associados à sua conta.
                </Text>
              </VStack>

              <VStack space="md">
                {detailItems.map((item) => {
                  const accentStyle = INFO_ACCENT_STYLES[item.accent];
                  return (
                    <HStack key={item.label} space="md" className="items-center">
                      <Box
                        className="h-12 w-12 rounded-xl items-center justify-center border"
                        style={{
                          backgroundColor: accentStyle.backgroundColor,
                          borderColor: accentStyle.borderColor,
                        }}
                      >
                        <Icon as={item.icon} className={accentStyle.iconClassName} size="lg" />
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-neutral-500 text-xs uppercase font-semibold">
                          {item.label}
                        </Text>
                        <Text className="text-neutral-900 text-sm font-medium">
                          {item.value}
                        </Text>
                      </VStack>
                    </HStack>
                  );
                })}
              </VStack>
            </VStack>
          </Box>

          <Box
            className="rounded-3xl shadow-soft-1 border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(248, 113, 113, 0.35)',
              paddingHorizontal: 20,
              paddingVertical: 24,
            }}
          >
            <VStack space="lg">
              <VStack space="xs">
                <Heading size="lg" className="text-neutral-900">
                  Ações da conta
                </Heading>
                <Text className="text-neutral-600 text-sm">
                  Gerencie o acesso e finalize a sessão quando necessário.
                </Text>
              </VStack>

              <Button onPress={handleLogout} className="bg-red-500">
                <HStack space="sm" className="items-center">
                  <Icon as={InfoIcon} className="text-white" size="sm" />
                  <ButtonText className="text-white font-semibold">
                    Sair da conta
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

