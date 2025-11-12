import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  Icon
} from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  AvailableEquipmentsDictionary,
  EquipmentData,
  EquipmentSpecificFieldWithValue,
  getAvailableEquipmentModels,
  registerEquipment,
} from '@/services/equipment';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

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
        <Box
          className={`rounded-2xl border px-4 py-3 flex-row items-center justify-between ${
            isInvalid ? 'border-red-500 bg-red-50/40' : 'border-neutral-200 bg-neutral-50'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selectedOption ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
          <Icon as={ChevronDownIcon} className="text-neutral-400 w-5 h-5" />
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
                    Selecionar Opção
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
                      <Box
                        className={`px-4 py-3 border-b border-neutral-100 ${
                          selectedValue === item.id ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedValue === item.id
                              ? 'text-blue-600'
                              : 'text-neutral-900'
                          }`}
                        >
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

interface DateInputProps {
  value: string;
  onValueChange: (date: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  inputRef?: React.Ref<any>;
  onSubmitEditing?: () => void;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onValueChange,
  placeholder = "DD/MM/AAAA",
  isInvalid = false,
  inputRef,
  onSubmitEditing,
}) => {
  const formatDate = (numbers: string) => {
    let formatted = numbers;
    
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
    }
    
    if (numbers.length >= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
    }
    
    return formatted;
  };

  const handleChangeText = (text: string) => {
    if (text.length < value.length && value.endsWith('/')) {
      const numbersOnly = value.replace(/\D/g, '');
      const newNumbers = numbersOnly.slice(0, -1);
      const formatted = formatDate(newNumbers);
      onValueChange(formatted);
      return;
    }
    
    const numbers = text.replace(/\D/g, '');
    const formatted = formatDate(numbers);
    onValueChange(formatted);
  };

  const inputContainerClassName = `rounded-2xl border ${
    isInvalid ? 'border-red-500 bg-red-50/40' : 'border-neutral-200 bg-neutral-50'
  }`;

  return (
    <Input className={inputContainerClassName}>
      <InputField
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        maxLength={10}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={onSubmitEditing}
      />
    </Input>
  );
};

interface LocationData {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationInputProps {
  value: LocationData;
  onValueChange: (location: LocationData) => void;
  isInvalid?: boolean;
  inputRef?: React.Ref<any>;
  onSubmitEditing?: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onValueChange,
  isInvalid = false,
  inputRef,
  onSubmitEditing,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const inputContainerClassName = `rounded-2xl border ${
    isInvalid ? 'border-red-500 bg-red-50/40' : 'border-neutral-200 bg-neutral-50'
  }`;

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Para usar a localização, é necessário permitir o acesso ao GPS.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (addressResponse.length > 0) {
          const addr = addressResponse[0];
          const fullAddress = [
            addr.street,
            addr.streetNumber,
            addr.district,
            addr.city,
            addr.region,
          ].filter(Boolean).join(', ');

          onValueChange({
            address: fullAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            coordinates: { latitude, longitude },
          });
        } else {
          onValueChange({
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            coordinates: { latitude, longitude },
          });
        }
      } catch (geocodeError) {
        console.error('Erro ao tentar obter endereço a partir da localização', geocodeError);
        onValueChange({
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: { latitude, longitude },
        });
      }

      Alert.alert(
        'Localização Capturada',
        'Localização obtida com sucesso!',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Erro ao obter a localização atual do dispositivo', error);
      Alert.alert(
        'Erro',
        'Não foi possível obter a localização. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const openInMaps = () => {
    if (value.coordinates) {
      const { latitude, longitude } = value.coordinates;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Alert.alert(
        'Abrir no Mapa',
        `Deseja abrir a localização no mapa?\n\nCoordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Abrir', 
            onPress: () => {
              Linking.openURL(url);
            }
          },
        ]
      );
    }
  };

  return (
    <VStack space="sm">
      <HStack space="sm" className="items-end">
        <Box className="flex-1">
          <Input className={inputContainerClassName}>
            <InputField
              ref={inputRef}
              placeholder="Digite o endereço ou use GPS"
              value={value.address}
              onChangeText={(text) => onValueChange({ ...value, address: text })}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={onSubmitEditing}
            />
          </Input>
        </Box>
        
        <Button
          size="md"
          variant="outline"
          onPress={getCurrentLocation}
          disabled={isLoadingLocation}
          className={`rounded-2xl border ${
            isLoadingLocation ? 'border-primary-200 bg-primary-50/70' : 'border-primary-200 bg-primary-50'
          }`}
        >
          <ButtonText
            className={`text-primary-600 font-semibold ${isLoadingLocation ? 'opacity-70' : ''}`}
          >
            {isLoadingLocation ? '📍...' : '📍 GPS'}
          </ButtonText>
        </Button>
      </HStack>

      {value.coordinates && (
        <VStack space="xs">
          <Text className="text-xs text-gray-600">
            📍 Coordenadas: {value.coordinates.latitude.toFixed(6)}, {value.coordinates.longitude.toFixed(6)}
          </Text>
          <Pressable onPress={openInMaps}>
            <Text className="text-xs text-blue-600 underline">
              🗺️ Ver no mapa
            </Text>
          </Pressable>
        </VStack>
      )}
    </VStack>
  );
};

const HEADER_GRADIENT_COLORS = ['#005DFF', '#00D26A'] as const;

const statusOptions = [
  { id: 'active', name: 'Ativo' },
  { id: 'inactive', name: 'Inativo' },
  { id: 'maintenance', name: 'Em manutenção' },
  { id: 'out_of_order', name: 'Fora de operação' },
];

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  electrical: 'Elétrico',
  mechanical: 'Mecânico',
  hydraulic: 'Hidráulico',
  none: 'Sem tipo',
};

const DEFAULT_EQUIPMENT_TYPES: SelectOption[] = ['electrical', 'mechanical', 'hydraulic', 'none'].map(
  (key) => ({
    id: key,
    name: EQUIPMENT_TYPE_LABELS[key] || key,
  })
);

const formatTypeLabel = (type: string) => {
  if (EQUIPMENT_TYPE_LABELS[type]) {
    return EQUIPMENT_TYPE_LABELS[type];
  }

  return type
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export default function RegisterEquipmentScreen() {
  const { idToken } = useAuthContext();
  
  const [equipmentTypes, setEquipmentTypes] = useState<SelectOption[]>(DEFAULT_EQUIPMENT_TYPES);
  const [availableEquipments, setAvailableEquipments] = useState<AvailableEquipmentsDictionary>({});
  const [isLoadingEquipmentModels, setIsLoadingEquipmentModels] = useState(false);

  const nameRef = useRef<any>(null);
  const installationDateRef = useRef<any>(null);
  const locationRef = useRef<any>(null);
  const specificFieldsRefs = useRef<{ [key: string]: any }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    installationDate: '',
    type: '',
    location: { address: '', coordinates: undefined } as LocationData,
    status: '',
    selectedEquipment: '',
    specificFields: {} as Record<string, string | number>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});



  useEffect(() => {
    let isActive = true;

    const loadAvailableEquipments = async () => {
      setIsLoadingEquipmentModels(true);
      const response = await getAvailableEquipmentModels(idToken ?? undefined);

      if (!isActive) return;

      if (response.success && response.data) {
        const availableData = response.data;
        setAvailableEquipments(availableData);

        const dynamicTypes: SelectOption[] = Object.keys(availableData).map((typeKey) => ({
          id: typeKey,
          name: formatTypeLabel(typeKey),
        }));

        if (!dynamicTypes.find((type) => type.id === 'none')) {
          dynamicTypes.push({ id: 'none', name: EQUIPMENT_TYPE_LABELS.none });
        }

        setEquipmentTypes(dynamicTypes);

        setFormData((prev) => {
          const typeStillAvailable = prev.type === 'none' || !prev.type || availableData[prev.type];
          const equipmentStillAvailable =
            typeStillAvailable && prev.type && prev.type !== 'none'
              ? availableData[prev.type]?.some((equipment) => equipment.id === prev.selectedEquipment)
              : true;

          if (typeStillAvailable && equipmentStillAvailable) {
            return prev;
          }

          return {
            ...prev,
            type: typeStillAvailable ? prev.type : '',
            selectedEquipment: equipmentStillAvailable ? prev.selectedEquipment : '',
            specificFields: {},
          };
        });
      } else if (response.error) {
        Alert.alert('Erro', response.error);
        setEquipmentTypes(DEFAULT_EQUIPMENT_TYPES);
        setAvailableEquipments({});
        setFormData((prev) => ({
          ...prev,
          type: prev.type === 'none' ? prev.type : '',
          selectedEquipment: '',
          specificFields: {},
        }));
      }

      setIsLoadingEquipmentModels(false);
    };

    loadAvailableEquipments();

    return () => {
      isActive = false;
    };
  }, [idToken]);

  const getEquipmentsByType = () => {
    if (!formData.type || formData.type === 'none') return [];
    return availableEquipments[formData.type] || [];
  };

  const getSelectedEquipmentDetails = () => {
    const equipments = getEquipmentsByType();
    return equipments.find(eq => eq.id === formData.selectedEquipment);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    
    if (!formData.installationDate) {
      newErrors.installationDate = 'Data de instalação é obrigatória';
    } else if (formData.installationDate.length !== 10) {
      newErrors.installationDate = 'Data deve estar no formato DD/MM/AAAA';
    } else {
      const dateParts = formData.installationDate.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
          newErrors.installationDate = 'Data inválida';
        } else {
          const dateObj = new Date(year, month - 1, day);
          if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
            newErrors.installationDate = 'Data inválida';
          }
        }
      } else {
        newErrors.installationDate = 'Data deve estar no formato DD/MM/AAAA';
      }
    }
    
    if (!formData.type) newErrors.type = 'Tipo é obrigatório';
    if (!formData.location.address.trim()) newErrors.location = 'Localização é obrigatória';
    if (!formData.status) newErrors.status = 'Status inicial é obrigatório';

    const equipmentDetails = getSelectedEquipmentDetails();
    if (equipmentDetails) {
      equipmentDetails.specificFields.forEach(field => {
        if (field.required && !formData.specificFields[field.id]) {
          newErrors[field.id] = `${field.name} é obrigatório`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      if (!idToken) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }
      const equipmentDetails = getSelectedEquipmentDetails();

      const specificFieldsPayload: EquipmentSpecificFieldWithValue[] = equipmentDetails
        ? equipmentDetails.specificFields.map((field) => ({
            ...field,
            value:
              formData.specificFields[field.id] !== undefined
                ? formData.specificFields[field.id]
                : '',
          }))
        : Object.entries(formData.specificFields).map(([fieldId, fieldValue]) => ({
            id: fieldId,
            name: formatTypeLabel(fieldId),
            type: typeof fieldValue === 'number' ? 'number' : 'text',
            required: false,
            options: [],
            value: fieldValue,
          }));

      const payload: EquipmentData = {
        ...formData,
        specificFields: specificFieldsPayload,
      };

      const result = await registerEquipment(payload, idToken);
      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Equipamento cadastrado com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Erro',
          result.error || 'Erro ao cadastrar equipamento',
          [{ text: 'OK' }]
        );
      }
      console.log('Dados do formulário:', payload);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' && { selectedEquipment: '', specificFields: {} }),
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateLocationData = (location: LocationData) => {
    setFormData(prev => ({
      ...prev,
      location,
    }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const updateSpecificField = (fieldId: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      specificFields: {
        ...prev.specificFields,
        [fieldId]: value,
      },
    }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const getFieldContainerClassName = (hasError?: boolean) =>
    `rounded-2xl border ${hasError ? 'border-red-500 bg-red-50/40' : 'border-neutral-200 bg-neutral-50'}`;

  const equipmentsByType = getEquipmentsByType();
  const selectedEquipmentDetails = getSelectedEquipmentDetails();
  const equipmentSpecificFields = selectedEquipmentDetails?.specificFields ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Box className="flex-1 bg-background">
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
                  <Pressable onPress={() => router.back()} className="bg-white/10 p-2 rounded-full">
                    <Icon as={ArrowLeftIcon} className="text-white w-6 h-6" />
                  </Pressable>
                  <Box className="w-10" />
                </HStack>

                <VStack space="xs">
                  <Text className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                    Registro de ativos
                  </Text>
                  <Heading size="3xl" className="text-white font-bold">
                    Cadastrar Equipamento
                  </Heading>
                  <Text className="text-white/80 text-sm">
                    Preencha os dados para adicionar um novo equipamento ao inventário.
                  </Text>
                </VStack>
              </VStack>
            </LinearGradient>
          </Box>

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 120,
            }}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
          >
            <VStack space="xl">
              {isLoadingEquipmentModels && (
                <Box
                  className="rounded-3xl border"
                  style={{ backgroundColor: '#E3EEFF', borderColor: '#B3CDFF' }}
                >
                  <HStack className="items-center" space="md" style={{ padding: 16 }}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <VStack space="xs">
                      <Heading size="sm" className="text-neutral-900">
                        Carregando modelos disponíveis
                      </Heading>
                      <Text className="text-neutral-600 text-sm">
                        Aguarde enquanto buscamos os tipos e modelos cadastrados.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <Box
                className="rounded-3xl border shadow-soft-1"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E0E9FF' }}
              >
                <VStack className="p-6" space="lg">
                  <VStack space="xs">
                    <Heading size="lg" className="text-neutral-900">
                      Informações Básicas
                    </Heading>
                    <Text className="text-neutral-500 text-sm">
                      Defina os dados principais do equipamento.
                    </Text>
                  </VStack>

                  <VStack space="md">
                    <FormControl isInvalid={!!errors.name}>
                      <FormControlLabel>
                        <FormControlLabelText>Nome do Equipamento</FormControlLabelText>
                      </FormControlLabel>
                      <Input className={getFieldContainerClassName(!!errors.name)}>
                        <InputField
                          ref={nameRef}
                          placeholder="Digite o nome do equipamento"
                          value={formData.name}
                          onChangeText={(value) => updateFormData('name', value)}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={() =>
                            installationDateRef.current && installationDateRef.current.focus()
                          }
                        />
                      </Input>
                      {errors.name && (
                        <FormControlError>
                          <FormControlErrorText>{errors.name}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.installationDate}>
                      <FormControlLabel>
                        <FormControlLabelText>Data de Instalação</FormControlLabelText>
                      </FormControlLabel>
                      <DateInput
                        value={formData.installationDate}
                        onValueChange={(value) => updateFormData('installationDate', value)}
                        isInvalid={!!errors.installationDate}
                        inputRef={installationDateRef}
                        onSubmitEditing={() => locationRef.current && locationRef.current.focus()}
                      />
                      {errors.installationDate && (
                        <FormControlError>
                          <FormControlErrorText>{errors.installationDate}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.type}>
                      <FormControlLabel>
                        <FormControlLabelText>Tipo</FormControlLabelText>
                      </FormControlLabel>
                      <CustomSelect
                        placeholder={isLoadingEquipmentModels ? 'Carregando tipos...' : 'Selecione o tipo'}
                        options={equipmentTypes}
                        selectedValue={formData.type}
                        onValueChange={(value) => updateFormData('type', value)}
                        isInvalid={!!errors.type}
                      />
                      {errors.type && (
                        <FormControlError>
                          <FormControlErrorText>{errors.type}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.location}>
                      <FormControlLabel>
                        <FormControlLabelText>Localização</FormControlLabelText>
                      </FormControlLabel>
                      <LocationInput
                        value={formData.location}
                        onValueChange={updateLocationData}
                        isInvalid={!!errors.location}
                        inputRef={locationRef}
                      />
                      {errors.location && (
                        <FormControlError>
                          <FormControlErrorText>{errors.location}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.status}>
                      <FormControlLabel>
                        <FormControlLabelText>Status Inicial</FormControlLabelText>
                      </FormControlLabel>
                      <CustomSelect
                        placeholder="Selecione o status"
                        options={statusOptions}
                        selectedValue={formData.status}
                        onValueChange={(value) => updateFormData('status', value)}
                        isInvalid={!!errors.status}
                      />
                      {errors.status && (
                        <FormControlError>
                          <FormControlErrorText>{errors.status}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  </VStack>
                </VStack>
              </Box>

              {formData.type && formData.type !== 'none' && (
                <Box
                  className="rounded-3xl border shadow-soft-1"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E0E9FF' }}
                >
                  <VStack className="p-6" space="lg">
                    <VStack space="xs">
                      <Heading size="lg" className="text-neutral-900">
                        Modelo do Equipamento
                      </Heading>
                      <Text className="text-neutral-500 text-sm">
                        Selecione um modelo cadastrado para {formatTypeLabel(formData.type)}.
                      </Text>
                    </VStack>

                    <VStack space="md">
                      <FormControl>
                        <FormControlLabel>
                          <FormControlLabelText>Equipamento</FormControlLabelText>
                        </FormControlLabel>
                        <CustomSelect
                          placeholder={isLoadingEquipmentModels ? 'Carregando modelos...' : 'Selecione o modelo'}
                          options={equipmentsByType.map((eq) => ({ id: eq.id, name: eq.name }))}
                          selectedValue={formData.selectedEquipment}
                          onValueChange={(value) => updateFormData('selectedEquipment', value)}
                        />
                      </FormControl>

                      {!isLoadingEquipmentModels && equipmentsByType.length === 0 && (
                        <Text className="text-xs text-neutral-500">
                          Nenhum modelo disponível para este tipo no momento.
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                </Box>
              )}

              {selectedEquipmentDetails && (
                <Box
                  className="rounded-3xl border shadow-soft-1"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E0E9FF' }}
                >
                  <VStack className="p-6" space="lg">
                    <VStack space="xs">
                      <Heading size="lg" className="text-neutral-900">
                        Especificações Técnicas
                      </Heading>
                      <Text className="text-neutral-500 text-sm">
                        Preencha os campos adicionais configurados para este modelo.
                      </Text>
                    </VStack>

                    {equipmentSpecificFields.length > 0 ? (
                      <VStack space="md">
                        {equipmentSpecificFields.map((field, index) => {
                          const isLastField = index === equipmentSpecificFields.length - 1;
                          const nextField = equipmentSpecificFields[index + 1];
                          return (
                            <FormControl key={field.id} isInvalid={!!errors[field.id]}>
                              <FormControlLabel>
                                <FormControlLabelText>
                                  {field.name}
                                  {field.required && <Text className="text-red-500"> *</Text>}
                                </FormControlLabelText>
                              </FormControlLabel>
                              <Input className={getFieldContainerClassName(!!errors[field.id])}>
                                <InputField
                                  ref={(ref) => {
                                    if (ref) {
                                      specificFieldsRefs.current[field.id] = ref;
                                    }
                                  }}
                                  placeholder={`Digite ${field.name.toLowerCase()}`}
                                  value={formData.specificFields[field.id]?.toString() || ''}
                                  onChangeText={(value) => {
                                    const finalValue =
                                      field.type === 'number' && value ? parseFloat(value) || value : value;
                                    updateSpecificField(field.id, finalValue);
                                  }}
                                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                                  returnKeyType={isLastField ? 'done' : 'next'}
                                  blurOnSubmit={isLastField}
                                  onSubmitEditing={() => {
                                    if (!isLastField && nextField) {
                                      const nextFieldRef = specificFieldsRefs.current[nextField.id];
                                      if (nextFieldRef) {
                                        nextFieldRef.focus();
                                      }
                                    }
                                  }}
                                />
                              </Input>
                              {errors[field.id] && (
                                <FormControlError>
                                  <FormControlErrorText>{errors[field.id]}</FormControlErrorText>
                                </FormControlError>
                              )}
                            </FormControl>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Text className="text-sm text-neutral-500">
                        Este modelo não possui campos adicionais obrigatórios.
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}

              <Box
                className="rounded-3xl border shadow-soft-1"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E0E9FF' }}
              >
                <VStack className="p-6" space="lg">
                  <VStack space="xs">
                    <Heading size="lg" className="text-neutral-900">
                      Finalizar cadastro
                    </Heading>
                    <Text className="text-neutral-500 text-sm">
                      Revise as informações antes de salvar o equipamento.
                    </Text>
                  </VStack>

                  <VStack space="md">
                    <Button size="lg" onPress={handleSubmit} className="bg-primary-500 rounded-2xl">
                      <ButtonText className="text-white font-semibold">Cadastrar Equipamento</ButtonText>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onPress={() => router.back()}
                      className="rounded-2xl border-neutral-200 bg-white"
                    >
                      <ButtonText className="text-neutral-600 font-semibold">Cancelar</ButtonText>
                    </Button>
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </ScrollView>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}