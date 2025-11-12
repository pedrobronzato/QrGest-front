import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Inter_400Regular, useFonts as useInter } from '@expo-google-fonts/inter';
import { Montserrat_700Bold, useFonts as useMontserrat } from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [montserratLoaded] = useMontserrat({ Montserrat_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular });

  if (!montserratLoaded || !interLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SyncProvider>
        <GluestackUIProvider mode="light">
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="register-equipment" options={{ headerShown: false }} />
            <Stack.Screen name="my-equipments" options={{ headerShown: false }} />
            <Stack.Screen name="select-equipment-offline" options={{ headerShown: false }} />
            <Stack.Screen name="equipment-details" options={{ headerShown: false }} />
            <Stack.Screen name="equipment-maintenance" options={{ headerShown: false }} />
            <Stack.Screen name="assign-technician" options={{ headerShown: false }} />
            <Stack.Screen name="maintenance-reports" options={{ headerShown: false }} />
            <Stack.Screen name="maintenance-record-details" options={{ headerShown: false }} />
            <Stack.Screen name="scan-qr" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          </ThemeProvider>
        </GluestackUIProvider>
      </SyncProvider>
    </AuthProvider>
  );
}
