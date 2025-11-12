import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { DownloadIcon, Icon, ShareIcon, XIcon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { Dimensions, Modal } from 'react-native';

interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'video';
  name: string;
}

interface AttachmentViewerProps {
  attachment: Attachment | null;
  visible: boolean;
  onClose: () => void;
  onDownload?: (attachment: Attachment) => void;
  onShare?: (attachment: Attachment) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachment,
  visible,
  onClose,
  onDownload,
  onShare
}) => {
  if (!attachment) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(attachment);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black">
        <Box className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 pt-12 pb-4 px-4">
          <HStack className="items-center justify-between">
            <Pressable onPress={onClose} className="p-2">
              <Icon as={XIcon} className="text-white text-xl" />
            </Pressable>
            
            <Text className="text-white font-medium text-center flex-1">
              {attachment.name}
            </Text>
            
            <HStack space="sm">
              {onDownload && (
                <Pressable onPress={handleDownload} className="p-2">
                  <Icon as={DownloadIcon} className="text-white" />
                </Pressable>
              )}
              
              {onShare && (
                <Pressable onPress={handleShare} className="p-2">
                  <Icon as={ShareIcon} className="text-white" />
                </Pressable>
              )}
            </HStack>
          </HStack>
        </Box>

        <Box className="flex-1 justify-center items-center">
          {attachment.type === 'image' ? (
            <Box className="w-full h-full justify-center items-center">
              <img
                src={attachment.uri}
                alt={attachment.name}
                style={{
                  width: screenWidth,
                  height: screenHeight,
                  objectFit: 'contain'
                }}
              />
            </Box>
          ) : (
            <Box className="w-full h-full justify-center items-center">
              <video
                src={attachment.uri}
                controls
                style={{
                  width: screenWidth,
                  height: screenHeight,
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </Box>

        <Box className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
          <VStack space="sm">
            <Text className="text-white text-center font-medium">
              {attachment.name}
            </Text>
            <Text className="text-gray-300 text-center text-sm">
              {attachment.type === 'image' ? 'Imagem' : 'Vídeo'}
            </Text>
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
};
