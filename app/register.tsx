import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

import { GradientTitle } from '@/components/GradientTitle';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { AlertCircleIcon, ChevronDownIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { registerUser } from '@/services/auth';

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

const ACCOUNT_TYPE_OPTIONS: SelectOption[] = [
  { id: 'admin', name: 'Administrador' },
  { id: 'tecnico', name: 'Técnico' },
];

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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'tecnico' | ''>('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const formatPhone = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleRegister = async () => {
    setRoleError('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setCategoryError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!role) {
      setRoleError('Tipo de conta é obrigatório');
      return;
    }

    if (name.trim() === '') {
      setNameError('Nome é obrigatório');
      return;
    }

    if (name.trim().length < 2) {
      setNameError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (email.trim() === '') {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    if (phone.trim() === '') {
      setPhoneError('Telefone é obrigatório');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('Telefone inválido (deve ter entre 10 e 11 dígitos)');
      return;
    }

    const selectedRole = role as 'admin' | 'tecnico';

    if (selectedRole === 'tecnico') {
      if (category.trim() === '') {
        setCategoryError('Categoria é obrigatória');
        return;
      }
    }

    if (password.trim() === '') {
      setPasswordError('Senha é obrigatória');
      return;
    }

    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (confirmPassword.trim() === '') {
      setConfirmPasswordError('Confirmação de senha é obrigatória');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const categoryToSend = selectedRole === 'tecnico' ? category : '';
      const result = await registerUser(email, password, name, selectedRole, cleanPhone, categoryToSend);
      console.log(result, 'result');
      
      if (result.success) {
        setTimeout(() => {
          Alert.alert(
            'Sucesso', 
            'Conta criada com sucesso! Carregando seus dados...',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        }, 1500);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

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
            showsHorizontalScrollIndicator={false}
            horizontal={false}
            contentContainerStyle={{ 
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: 100
            }}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
          >
            <VStack className="p-6" space="lg" style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
              <VStack className="items-center" space="md">
                <VStack className="flex-row items-center gap-1">
                  <Image source={require('@/assets/images/logo.png')} style={{ width: 100, height: 100, borderRadius: 25 }} />
                  <GradientTitle>QrGest</GradientTitle>
                </VStack>
                
                <Text className="text-lg font-semibold text-center text-gray-800">Criar nova conta</Text>
              </VStack>
              
              <VStack space="md">
                <FormControl isInvalid={!!roleError} isDisabled={loading}>
                  <FormControlLabel>
                    <FormControlLabelText>Tipo de conta</FormControlLabelText>
                  </FormControlLabel>
                  <CustomSelect
                    placeholder="Selecione o tipo de conta"
                    options={ACCOUNT_TYPE_OPTIONS}
                    selectedValue={role}
                    onValueChange={(value) => {
                      const newRole = (value ?? '') as 'admin' | 'tecnico' | '';
                      setRole(newRole);
                      setRoleError('');
                      if (newRole === 'admin') {
                        setCategory('');
                        setCategoryError('');
                      }
                    }}
                    isInvalid={!!roleError}
                  />
                  {roleError && (
                    <FormControlError>
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText>
                        {roleError}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {role ? (
                  <>
                    <FormControl isInvalid={!!nameError} isDisabled={loading}>
                      <FormControlLabel>
                        <FormControlLabelText>Nome</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          type="text"
                          placeholder="Digite seu nome"
                          value={name}
                          onChangeText={(text) => {
                            setName(text);
                            setNameError('');
                          }}
                          autoCapitalize="words"
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </Input>
                      {nameError && (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>
                            {nameError}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!emailError} isDisabled={loading}>
                      <FormControlLabel>
                        <FormControlLabelText>Email</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          type="text"
                          placeholder="Digite seu email"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            setEmailError('');
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </Input>
                      {emailError && (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>
                            {emailError}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!phoneError} isDisabled={loading}>
                      <FormControlLabel>
                        <FormControlLabelText>Telefone</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          type="text"
                          placeholder="Digite seu telefone (com DDD)"
                          value={phone}
                          onChangeText={(text) => {
                            const formatted = formatPhone(text);
                            setPhone(formatted);
                            setPhoneError('');
                          }}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          maxLength={15}
                        />
                      </Input>
                      {phoneError && (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>
                            {phoneError}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    {role === 'tecnico' && (
                      <FormControl isInvalid={!!categoryError} isDisabled={loading}>
                        <FormControlLabel>
                          <FormControlLabelText>Categoria</FormControlLabelText>
                        </FormControlLabel>
                        <CustomSelect
                          placeholder="Selecione uma categoria"
                          options={TECHNICIAN_CATEGORIES}
                          selectedValue={category}
                          onValueChange={(value) => {
                            setCategory(value);
                            setCategoryError('');
                          }}
                          isInvalid={!!categoryError}
                        />
                        {categoryError && (
                          <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} />
                            <FormControlErrorText>
                              {categoryError}
                            </FormControlErrorText>
                          </FormControlError>
                        )}
                      </FormControl>
                    )}

                    <FormControl isInvalid={!!passwordError} isDisabled={loading}>
                      <FormControlLabel>
                        <FormControlLabelText>Senha</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          type="password"
                          placeholder="Digite sua senha"
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            setPasswordError('');
                          }}
                          secureTextEntry
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </Input>
                      {passwordError && (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>
                            {passwordError}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!confirmPasswordError} isDisabled={loading}>
                      <FormControlLabel>
                        <FormControlLabelText>Confirmar Senha</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          type="password"
                          placeholder="Confirme sua senha"
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            setConfirmPasswordError('');
                          }}
                          secureTextEntry
                          returnKeyType="done"
                          blurOnSubmit={true}
                        />
                      </Input>
                      {confirmPasswordError && (
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText>
                            {confirmPasswordError}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  </>
                ) : (
                  <Text className="text-sm text-gray-600">
                    Selecione o tipo de conta para exibir os campos de cadastro.
                  </Text>
                )}
              </VStack>

              {role && (
                <VStack space="md" className="pt-6">
                  <Button
                    size="lg"
                    onPress={handleRegister}
                    disabled={loading}
                    className="bg-success-600"
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ButtonText className="text-white font-semibold">
                        Criar Conta
                      </ButtonText>
                    )}
                  </Button>

                  <TouchableOpacity onPress={goToLogin} disabled={loading}>
                    <Text className={`text-center text-blue-600 ${loading ? 'opacity-60' : ''}`}>
                      Já tem uma conta? Faça login
                    </Text>
                  </TouchableOpacity>
                </VStack>
              )}
            </VStack>
          </ScrollView>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

 