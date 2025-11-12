import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

import { GradientTitle } from '@/components/GradientTitle';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { AlertCircleIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { loginUser } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    if (email.trim() === '') {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    if (password.trim() === '') {
      setPasswordError('Senha é obrigatória');
      return;
    }

    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        Alert.alert('Sucesso', 'Login realizado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
            }
          }
        ]);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.log(error, 'error login');
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
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
              paddingBottom: 100,
            }}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
          >
            <VStack
              className="p-6"
              space="lg"
              style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}
            >
              <VStack className="items-center" space="md">
                <VStack className="flex-row items-center gap-1">
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={{ width: 100, height: 100, borderRadius: 25 }}
                  />
                  <GradientTitle>QrGest</GradientTitle>
                </VStack>

                <Text className="text-lg font-semibold text-center text-gray-800">
                  Acesse sua conta
                </Text>
              </VStack>

              <VStack space="md">
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
                      returnKeyType="done"
                      blurOnSubmit
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
              </VStack>

              <VStack space="md" className="pt-6">
                <Button
                  size="lg"
                  onPress={handleLogin}
                  disabled={loading}
                  className="bg-success-600"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ButtonText className="text-white font-semibold">
                      Entrar
                    </ButtonText>
                  )}
                </Button>

                <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
                  <Text className={`text-center text-blue-600 ${loading ? 'opacity-60' : ''}`}>
                    Não tem uma conta? Cadastre-se
                  </Text>
                </TouchableOpacity>
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}