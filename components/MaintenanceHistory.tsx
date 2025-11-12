import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { CheckCircleIcon, ClockIcon, Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { MaintenanceRecord } from '@/services/equipment';
import { EquipmentStatusKey, resolveEquipmentStatus } from '@/utils/equipment';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';

interface MaintenanceHistoryProps {
  history: MaintenanceRecord[];
  onViewDetails: (record: MaintenanceRecord) => void;
  onSyncRecord?: (record: MaintenanceRecord) => void;
}

export const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({
  history,
  onViewDetails,
  onSyncRecord
}) => {
  const getStatusIcon = (status: EquipmentStatusKey | null) => {
    switch (status) {
      case 'active':
        return CheckCircleIcon;
      case 'maintenance_pending':
        return () => <MaterialIcons name="warning" size={24} color="#f59e0b" />;
      case 'maintenance':
        return () => <MaterialIcons name="build-circle" size={24} color="#f97316" />;
      case 'inactive':
        return () => <MaterialIcons name="cancel" size={24} color="#dc2626" />;
      default:
        return () => <MaterialIcons name="build" size={24} color="#6b7280" />;
    }
  };

  const getSyncStatusIcon = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return CheckCircleIcon;
      case 'pending':
        return () => <MaterialIcons name="sync" size={24} color="#f59e0b" />;
      case 'offline':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'offline':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (history.length === 0) {
    return (
      <Box className="bg-white rounded-lg p-6">
        <VStack className="items-center" space="sm">
          <Icon as={ClockIcon} className="text-gray-400 text-3xl" />
          <Text className="text-gray-500 text-center">
            Nenhum registro de manutenção encontrado{'\n'}
            <Text className="text-primary-500">
              Os registros aparecerão aqui após serem criados
            </Text>
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack space="md">
      <HStack className="items-center justify-between">
        <HStack className="items-center" space="sm">
          <Icon as={ClockIcon} className="text-primary-500" />
          <Text className="text-lg font-semibold text-gray-800">
            Histórico de Manutenções ({history.length})
          </Text>
        </HStack>
      </HStack>

      <VStack space="sm">
        {history.map((record, index) => {
          const statusMeta = resolveEquipmentStatus(record.statusAfterReview);
          const StatusIcon = getStatusIcon(statusMeta.canonical);
          const statusColor = statusMeta.badgeColors.textColor;

          return (
            <Box
              key={record.id || index}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
            <HStack className="items-start justify-between mb-3">
              <VStack className="flex-1" space="xs">
                <HStack className="items-center" space="sm">
                  <Icon 
                    as={StatusIcon} 
                    className="text-lg"
                    style={{ color: statusColor }} 
                  />
                  <Text className="text-gray-800 font-semibold">
                    {statusMeta.label}
                  </Text>
                </HStack>
                
                <HStack className="items-center" space="sm">
                  <MaterialIcons name="event" size={16} color="#9ca3af" />
                  <Text className="text-gray-600 text-sm">
                    {formatDate(record.reviewDate)} às {formatTime(record.reviewDate)}
                  </Text>
                </HStack>
              </VStack>

              <HStack className="items-center" space="sm">
                <Icon 
                  as={getSyncStatusIcon(record.syncStatus)} 
                  className={`text-sm ${getSyncStatusColor(record.syncStatus)}`} 
                />
                <Text className={`text-xs font-medium ${getSyncStatusColor(record.syncStatus)}`}>
                  {record.syncStatus === 'synced' ? 'Sincronizado' :
                   record.syncStatus === 'pending' ? 'Pendente' :
                   record.syncStatus === 'offline' ? 'Offline' : record.syncStatus}
                </Text>
              </HStack>
            </HStack>

            {record.serviceDescription && (
              <Box className="mb-3">
                <Text className="text-gray-700 text-sm leading-relaxed">
                  {record.serviceDescription}
                </Text>
              </Box>
            )}

            {record.partsReplaced && (
              <Box className="mb-3">
                <HStack className="items-center mb-1" space="sm">
                  <MaterialIcons name="build" size={16} color="#9ca3af" />
                  <Text className="text-gray-600 font-medium text-sm">Peças/Ajustes:</Text>
                </HStack>
                <Text className="text-gray-700 text-sm leading-relaxed">
                  {record.partsReplaced}
                </Text>
              </Box>
            )}

            {record.nextMaintenanceDate && (
              <Box className="mb-3">
                <HStack className="items-center" space="sm">
                  <MaterialIcons name="event" size={16} color="#9ca3af" />
                  <Text className="text-gray-600 text-sm">
                    Próxima manutenção: {formatDate(record.nextMaintenanceDate)}
                  </Text>
                </HStack>
              </Box>
            )}

            <HStack className="justify-end" space="sm">
              {onSyncRecord && record.syncStatus !== 'synced' && (
                <Button
                  onPress={() => onSyncRecord(record)}
                  action="secondary"
                  size="sm"
                >
                  <MaterialIcons name="sync" size={16} color="#6b7280" />
                  <ButtonText>Sincronizar</ButtonText>
                </Button>
              )}
              
              <Button
                onPress={() => onViewDetails(record)}
                action="primary"
                size="sm"
              >
                <ButtonText>Ver Detalhes</ButtonText>
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};
