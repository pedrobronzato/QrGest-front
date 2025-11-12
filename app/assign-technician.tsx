import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { AlertCircleIcon, ArrowLeftIcon, ChevronDownIcon, Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import { assignTechnicianToEquipment, findTechnicianByEmail, sendInvite, Technician } from '@/services/auth';
import { LinearGradient } from 'expo-linear-gradient';

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;
const INFO_CARD_BACKGROUND = '#EEF4FF';
const INFO_CARD_BORDER = '#C7DAFF';
const WARNING_CARD_BACKGROUND = '#FEF3C7';
const WARNING_CARD_BORDER = '#FDE68A';
const SUCCESS_CARD_BACKGROUND = '#ECFDF5';
const SUCCESS_CARD_BORDER = '#BBF7D0';

interface SelectOption {
  id: string;
  name: string;
}

interface CustomSelectProps {
  placeholder: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  isInvalid?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  placeholder,
  options,
  selectedValue,
  onValueChange,
  isInvalid = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.id === selectedValue);
  
  return (
    <>
      <Pressable onPress={() => setIsModalVisible(true)}>
        <Box className={`border rounded px-3 py-3 flex-row items-center justify-between ${
          isInvalid ? 'border-red-500' : 'border-gray-300'
        }`}>
          <Text className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
          <ChevronDownIcon className="text-gray-400 w-5 h-5" />
        </Box>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <Box className="flex-1 justify-end">
            <TouchableOpacity activeOpacity={1}>
              <Box className="bg-white rounded-t-lg">
                <Box className="p-4 border-b border-gray-200">
                  <Text className="text-lg font-semibold text-center">
                    Selecionar Categoria
                  </Text>
                </Box>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onValueChange(item.id);
                        setIsModalVisible(false);
                      }}
                    >
                      <Box className={`p-4 border-b border-gray-100 ${
                        selectedValue === item.id ? 'bg-blue-50' : ''
                      }`}>
                        <Text className={`text-base ${
                          selectedValue === item.id ? 'text-blue-600 font-medium' : 'text-gray-900'
                        }`}>
                          {item.name}
                        </Text>
                      </Box>
                    </TouchableOpacity>
                  )}
                />
                <Box className="p-4">
                  <Button
                    variant="outline"
                    onPress={() => setIsModalVisible(false)}
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                </Box>
              </Box>
            </TouchableOpacity>
          </Box>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const TECHNICIAN_CATEGORIES = [
  { id: 'eletricista', name: 'Eletricista' },
  { id: 'encanador', name: 'Encanador' },
  { id: 'pintor', name: 'Pintor' },
  { id: 'pedreiro', name: 'Pedreiro' },
  { id: 'marceneiro', name: 'Marceneiro' },
  { id: 'jardineiro', name: 'Jardineiro' },
  { id: 'limpeza', name: 'Limpeza' },
  { id: 'manutencao', name: 'Manutenção Geral' },
  { id: 'ar_condicionado', name: 'Ar Condicionado' },
  { id: 'seguranca', name: 'Segurança' },
  { id: 'outros', name: 'Outros' },
];

export default function AssignTechnicianScreen() {
  const { equipmentId, equipmentName } = useLocalSearchParams<{ equipmentId: string; equipmentName: string }>();
  const { idToken } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [foundTechnician, setFoundTechnician] = useState<Technician | null>(null);
  const [technicianNotFound, setTechnicianNotFound] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSearchTechnician = async () => {
    setEmailError('');
    setCategoryError('');
    setFoundTechnician(null);
    setTechnicianNotFound(false);

    if (email.trim() === '') {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    if (category.trim() === '') {
      setCategoryError('Categoria é obrigatória');
      return;
    }

    setSearching(true);

    try {
      const { technician } = await findTechnicianByEmail(idToken || '', email.trim());

      console.log(technician, 'result');
      
      if (technician) {
        console.log(technician, 'result');
        console.log(technician.category, 'result.technician.category');
        console.log(category, 'category');
        if (technician.category === category) {
          setFoundTechnician(technician);
        } else {
          setEmailError('Técnico encontrado, mas a categoria não corresponde');
        }
      } else {
        setEmailError('Técnico não encontrado');
        setTechnicianNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao buscar técnico:', error);
      setEmailError('Erro ao buscar técnico');
      setTechnicianNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!foundTechnician || !equipmentId) {
      Alert.alert('Erro', 'Dados inválidos para associação');
      return;
    }

    setLoading(true);

    try {
      const result = await assignTechnicianToEquipment(
        idToken || '', 
        foundTechnician.uid, 
        equipmentId
      );
      
      if (result.success) {
        Alert.alert(
          'Sucesso', 
          'Técnico associado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', result.error || 'Erro ao associar técnico');
      }
    } catch (error) {
      console.error('Erro ao associar técnico:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!email.trim() || !category.trim()) {
      Alert.alert('Erro', 'Email e categoria são obrigatórios para enviar convite');
      return;
    }

    setSendingInvite(true);

    try {
      const technicianName = email.split('@')[0];
      const result = await sendInvite(
        idToken || '',
        email.trim(),
        technicianName,
        category
      );
      
      if (result.success) {
        Alert.alert(
          'Convite Enviado', 
          'Convite enviado com sucesso! O técnico receberá um email para se cadastrar.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', result.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao enviar convite');
    } finally {
      setSendingInvite(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const decodedEquipmentName = useMemo(
    () => (equipmentName ? decodeURIComponent(equipmentName) : ''),
    [equipmentName],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Box className="flex-1 bg-background">
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Box className="overflow-hidden">
              <LinearGradient
                colors={HEADER_GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: '100%',
                  paddingTop: 56,
                  paddingBottom: 28,
                  paddingHorizontal: 24,
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                }}
              >
                <VStack space="lg">
                  <HStack className="items-center justify-between">
                    <Pressable onPress={goBack} className="bg-white/10 p-2 rounded-full">
                      <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
                    </Pressable>
                    <Box className="w-10" />
                  </HStack>

                  <VStack space="xs">
                    <Text className="text-white/60 text-xs uppercase tracking-[3px] font-semibold">
                      Gestão de técnicos
                    </Text>
                    <Text className="text-white font-bold text-3xl">
                      Associar Técnico
                    </Text>
                    <Text className="text-white/80 text-sm">
                      Encontre e vincule um profissional ao equipamento selecionado ou envie um convite para novos técnicos.
                    </Text>
                  </VStack>

                  <Box
                    className="rounded-3xl border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(255, 255, 255, 0.24)',
                      paddingHorizontal: 16,
                      paddingVertical: 18,
                    }}
                  >
                    <VStack space="sm">
                      <Text className="text-white/70 text-[11px] uppercase tracking-wide font-semibold">
                        Equipamento selecionado
                      </Text>
                      <Text className="text-white text-lg font-semibold">
                        {decodedEquipmentName || 'Nome não informado'}
                      </Text>
                      <Text className="text-white/70 text-xs">
                        Informe um email válido e a categoria correspondente para localizar o técnico.
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </LinearGradient>
            </Box>

            <VStack className="px-6 pt-6" space="lg" style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }}>
              <Box
                className="rounded-3xl border shadow-soft-1"
                style={{
                  backgroundColor: INFO_CARD_BACKGROUND,
                  borderColor: INFO_CARD_BORDER,
                  paddingHorizontal: 20,
                  paddingVertical: 24,
                }}
              >
                <VStack space="lg">
                  <VStack space="xs">
                    <Text className="text-neutral-900 text-lg font-semibold">
                      Buscar técnico existente
                    </Text>
                    <Text className="text-neutral-500 text-sm">
                      Digite o email do profissional e selecione a categoria correspondente para validar o cadastro.
                    </Text>
                  </VStack>

                  <VStack space="md">
                    <FormControl isInvalid={!!emailError}>
                      <FormControlLabel>
                        <FormControlLabelText>Email do técnico</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white border border-neutral-200 rounded-2xl">
                        <InputField
                          type="text"
                          placeholder="profissional@email.com"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            setEmailError('');
                            setFoundTechnician(null);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </Input>
                      {emailError ? (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>{emailError}</FormControlErrorText>
                        </FormControlError>
                      ) : null}
                    </FormControl>

                    <FormControl isInvalid={!!categoryError}>
                      <FormControlLabel>
                        <FormControlLabelText>Categoria</FormControlLabelText>
                      </FormControlLabel>
                      <CustomSelect
                        placeholder="Selecione a categoria"
                        options={TECHNICIAN_CATEGORIES}
                        selectedValue={category}
                        onValueChange={(value) => {
                          setCategory(value);
                          setCategoryError('');
                          setFoundTechnician(null);
                        }}
                        isInvalid={!!categoryError}
                      />
                      {categoryError ? (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>{categoryError}</FormControlErrorText>
                        </FormControlError>
                      ) : null}
                    </FormControl>

                    <Button
                      size="lg"
                      onPress={handleSearchTechnician}
                      disabled={searching || !email.trim() || !category}
                      className="bg-primary-500 rounded-2xl"
                    >
                      {searching ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <ButtonText className="text-white font-semibold">
                          Buscar técnico
                        </ButtonText>
                      )}
                    </Button>
                  </VStack>
                </VStack>
              </Box>

              {foundTechnician ? (
                <Box
                  className="rounded-3xl border shadow-soft-1"
                  style={{
                    backgroundColor: SUCCESS_CARD_BACKGROUND,
                    borderColor: SUCCESS_CARD_BORDER,
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                  }}
                >
                  <VStack space="lg">
                    <VStack space="xs">
                      <Text className="text-emerald-700 text-lg font-semibold">
                        Técnico encontrado
                      </Text>
                      <Text className="text-emerald-600 text-sm">
                        Confirme os dados abaixo e finalize a associação.
                      </Text>
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-emerald-700 text-sm">
                        <Text className="font-semibold">Nome:</Text> {foundTechnician.name}
                      </Text>
                      <Text className="text-emerald-700 text-sm">
                        <Text className="font-semibold">Email:</Text> {foundTechnician.email}
                      </Text>
                      {foundTechnician.phone ? (
                        <Text className="text-emerald-700 text-sm">
                          <Text className="font-semibold">Telefone:</Text> {foundTechnician.phone}
                        </Text>
                      ) : null}
                      <Text className="text-emerald-700 text-sm">
                        <Text className="font-semibold">Categoria:</Text>{' '}
                        {TECHNICIAN_CATEGORIES.find((cat) => cat.id === foundTechnician.category)?.name || '—'}
                      </Text>
                    </VStack>

                    <Button
                      size="lg"
                      onPress={handleAssignTechnician}
                      disabled={loading}
                      className="bg-emerald-600 rounded-2xl"
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <ButtonText className="text-white font-semibold">
                          Associar técnico
                        </ButtonText>
                      )}
                    </Button>
                  </VStack>
                </Box>
              ) : null}

              {technicianNotFound && !foundTechnician ? (
                <Box
                  className="rounded-3xl border shadow-soft-1"
                  style={{
                    backgroundColor: WARNING_CARD_BACKGROUND,
                    borderColor: WARNING_CARD_BORDER,
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                  }}
                >
                  <VStack space="lg">
                    <VStack space="xs">
                      <Text className="text-amber-800 text-lg font-semibold">
                        Técnico não encontrado
                      </Text>
                      <Text className="text-amber-700 text-sm">
                        Envie um convite para que o profissional se cadastre no sistema.
                      </Text>
                    </VStack>

                    <Button
                      size="lg"
                      onPress={handleSendInvite}
                      disabled={sendingInvite || !email.trim() || !category.trim()}
                      className="bg-amber-500 rounded-2xl"
                    >
                      {sendingInvite ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <ButtonText className="text-white font-semibold">
                          Enviar convite por email
                        </ButtonText>
                      )}
                    </Button>
                  </VStack>
                </Box>
              ) : null}
            </VStack>
          </ScrollView>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 