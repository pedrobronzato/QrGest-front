import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { EyeIcon, Icon, PaperclipIcon, PhotoIcon, TrashIcon, VideoCameraIcon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { Alert } from 'react-native';

interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'video';
  name: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAddAttachment: (type: 'image' | 'video') => void;
  onRemoveAttachment: (id: string) => void;
  onViewAttachment: (attachment: Attachment) => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onViewAttachment
}) => {
  const handleAddAttachment = (type: 'image' | 'video') => {
    Alert.alert(
      'Adicionar Anexo',
      `Escolha como adicionar ${type === 'image' ? 'uma foto' : 'um vídeo'}`,
      [
        { 
          text: 'Câmera', 
          onPress: () => onAddAttachment(type),
          icon: type === 'image' ? 'camera' : 'videocam'
        },
        { 
          text: 'Galeria', 
          onPress: () => onAddAttachment(type),
          icon: type === 'image' ? 'photo-library' : 'video-library'
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleRemoveAttachment = (attachment: Attachment) => {
    Alert.alert(
      'Remover Anexo',
      `Deseja remover ${attachment.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => onRemoveAttachment(attachment.id)
        }
      ]
    );
  };

  return (
    <VStack space="md">
      <HStack space="sm" className="flex-wrap">
        <Button
          onPress={() => handleAddAttachment('image')}
          action="secondary"
          size="sm"
        >
          <ButtonIcon as={PhotoIcon} />
          <ButtonText>Foto</ButtonText>
        </Button>
        
        <Button
          onPress={() => handleAddAttachment('video')}
          action="secondary"
          size="sm"
        >
          <ButtonIcon as={VideoCameraIcon} />
          <ButtonText>Vídeo</ButtonText>
        </Button>
      </HStack>

      {attachments.length > 0 && (
        <VStack space="sm">
          <Text className="text-gray-700 font-medium">Anexos ({attachments.length})</Text>
          
          {attachments.map((attachment) => (
            <Box
              key={attachment.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <HStack className="items-center justify-between">
                <HStack className="items-center flex-1" space="sm">
                  <Icon 
                    as={attachment.type === 'image' ? PhotoIcon : VideoCameraIcon} 
                    className="text-primary-500" 
                  />
                  
                  <VStack className="flex-1">
                    <Text className="text-gray-800 font-medium text-sm">
                      {attachment.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {attachment.type === 'image' ? 'Imagem' : 'Vídeo'}
                    </Text>
                  </VStack>
                </HStack>

                <HStack space="sm">
                  <Pressable
                    onPress={() => onViewAttachment(attachment)}
                    className="p-2"
                  >
                    <Icon as={EyeIcon} className="text-blue-500" />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleRemoveAttachment(attachment)}
                    className="p-2"
                  >
                    <Icon as={TrashIcon} className="text-red-500" />
                  </Pressable>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      {attachments.length === 0 && (
        <Box className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <VStack className="items-center" space="sm">
            <Icon as={PaperclipIcon} className="text-gray-400 text-2xl" />
            <Text className="text-gray-500 text-center">
              Nenhum anexo adicionado{'\n'}
              <Text className="text-primary-500">
                Toque nos botões acima para adicionar fotos ou vídeos
              </Text>
            </Text>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};
