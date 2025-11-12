import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVBAR_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;

export default function GradientTabBarBackground() {
  return (
    <LinearGradient
      colors={NAVBAR_GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

export function useBottomTabOverflow() {
  const insets = useSafeAreaInsets();

  try {
    return useBottomTabBarHeight();
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'useBottomTabOverflow: não foi possível obter a altura da tab bar. Retornando o inset inferior como fallback.',
        error
      );
    }

    return insets.bottom;
  }
}
