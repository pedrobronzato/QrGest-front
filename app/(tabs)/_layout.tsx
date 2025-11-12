import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AuthGuard } from '@/components/AuthGuard';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

const TAB_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const QR_BUTTON_SIZE = 80;

function QrTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.qrButtonContainer, focused && styles.qrButtonContainerFocused]}>
      <LinearGradient
        colors={TAB_GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.qrButtonGradient}
      >
        <IconSymbol name="qrcode.viewfinder" color="#FFFFFF" size={50} />
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.72)',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            bottom: 0,
            height: 70,
            width: '100%',
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === 'ios' ? 10 : 8,
            overflow: 'visible',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => <QrTabIcon focused={focused} />,
            tabBarItemStyle: {
              marginTop: -18,
            },
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  qrButtonContainer: {
    width: QR_BUTTON_SIZE,
    height: QR_BUTTON_SIZE,
    borderRadius: QR_BUTTON_SIZE / 2,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonContainerFocused: {
    transform: [{ translateY: -4 }],
  },
  qrButtonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: QR_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
