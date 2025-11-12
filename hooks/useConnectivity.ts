import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface ConnectivityState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const checkConnectivity = () => {
        setIsOnline(navigator.onLine !== false);
        setIsInternetReachable(navigator.onLine !== false);
        setConnectionType(navigator.onLine ? 'wifi' : 'none');
      };

      checkConnectivity();

      window.addEventListener('online', checkConnectivity);
      window.addEventListener('offline', checkConnectivity);

      return () => {
        window.removeEventListener('online', checkConnectivity);
        window.removeEventListener('offline', checkConnectivity);
      };
    } else {
      console.log('📡 Inicializando monitoramento de conectividade...');
      
      NetInfo.fetch().then(state => {
        console.log('📡 Estado inicial de rede:', state);
        setIsOnline(state.isConnected ?? false);
        setIsInternetReachable(state.isInternetReachable ?? null);
        setConnectionType(state.type);
      });

      const unsubscribe = NetInfo.addEventListener(state => {
        console.log('📡 Mudança de conectividade:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
        
        setIsOnline(state.isConnected ?? false);
        setIsInternetReachable(state.isInternetReachable ?? null);
        setConnectionType(state.type);
      });

      return () => {
        console.log('📡 Desconectando listener de rede');
        unsubscribe();
      };
    }
  }, []);

  return {
    isOnline,
    isInternetReachable,
    type: connectionType,
  };
};
