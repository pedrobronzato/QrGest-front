import { GradientTitle } from '@/components/GradientTitle';
import { useAuthContext } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

export default function Index() {
  const { loading, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        console.log('✅ Usuário autenticado, redirecionando para home...');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Usuário não autenticado, redirecionando para login...');
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo}
        />
        <GradientTitle>QrGest</GradientTitle>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
  },
  loadingContainer: {
    marginTop: 40,
  },
}); 