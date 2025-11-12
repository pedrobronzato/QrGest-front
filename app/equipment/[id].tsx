import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function EquipmentRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace(`/equipment-details?id=${id}`);
    } else {
      router.replace('/(tabs)');
    }
  }, [id]);

  return null;
} 