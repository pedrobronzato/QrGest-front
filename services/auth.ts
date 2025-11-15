import { apiUrl } from '@/config/apiUrl';
import { auth } from '@/config/firebase';
import axios from 'axios';
import {
  AuthError,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserEquipment {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  installationDate: string;
  selectedEquipment: string;
  assignedAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'tecnico';
  createdAt: string;
  updatedAt: string;
  equipments?: UserEquipment[];
}

export interface Technician {
  uid: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  role: 'tecnico';
}

export interface AssignmentResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'tecnico',
  phone: string,
  category: string
): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    const idToken = await user.getIdToken();

    console.log({
      uid: user.uid,
      name: displayName,
      role: role,
      phone: phone,
      email: email,
      category: category
    }, 'user api');
    const response = await axios.post(
      `${apiUrl}/api/user/register`,
      {
        uid: user.uid,
        name: displayName,
        role: role,
        phone: phone,
        email: email,
        category: category
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    console.log(response, 'response');

    return {
      user: user,
      success: true,
    };
  } catch (error: any) {
    console.log(error, 'error');
    const authError = error as AuthError;
    return {
      success: false,
      error: getErrorMessage(authError.code) || 'Erro ao registrar',
    };
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getErrorMessage(authError.code)
    };
  }
};

export const logoutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return {
      success: true
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getErrorMessage(authError.code)
    };
  }
};

export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getErrorMessage(authError.code)
    };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserProfile = async (
  idToken: string,
  useCache: boolean = false
): Promise<{ 
  success: boolean; 
  profile?: UserProfile; 
  error?: string;
  fromCache?: boolean;
}> => {
  const { cacheUserProfile, getCachedUserProfile } = await import('./offlineStorage');

  if (useCache) {
    const cached = await getCachedUserProfile();
    if (cached) {
      console.log('📦 Usando perfil do cache');
      return {
        success: true,
        profile: cached.profile,
        fromCache: true,
      };
    }
  }

  try {
    const response = await axios.get(`${apiUrl}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    await cacheUserProfile(response.data);

    return {
      success: true,
      profile: response.data,
      fromCache: false,
    };
  } catch (error: any) {
    console.warn('Erro ao buscar perfil do usuário:', error);
    
    const cached = await getCachedUserProfile();
    if (cached) {
      console.log('📦 Usando cache como fallback após erro');
      return {
        success: true,
        profile: cached.profile,
        fromCache: true,
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao buscar dados do usuário',
    };
  }
};

export const getTechnicians = async (idToken: string): Promise<{ success: boolean; technicians?: Technician[]; error?: string }> => {
  try {
    const response = await axios.get(`${apiUrl}/api/technicians`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return {
      success: true,
      technicians: response.data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar técnicos:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao buscar técnicos',
    };
  }
};

export const findTechnicianByEmail = async (idToken: string, email: string): Promise<{technician: Technician}> => {
  try {
    const response = await axios.get(`${apiUrl}/api/user/technicians/search?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return {
      technician: response.data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar técnico por email:', error);
    return error.response?.data?.message || 'Erro ao buscar técnico';
  }
};

export const assignTechnicianToEquipment = async (
  idToken: string, 
  technicianUid: string, 
  equipmentId: string
): Promise<AssignmentResult> => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/user/assign-technician`,
      {
        technicianUid,
        equipmentId,
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao associar técnico:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao associar técnico ao equipamento',
    };
  }
};

const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Usuário não encontrado.';
    case 'auth/wrong-password':
      return 'Senha incorreta.';
    case 'auth/email-already-in-use':
      return 'Este email já está sendo usado por outra conta.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-disabled':
      return 'Esta conta foi desabilitada.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet.';
    case 'auth/invalid-credential':
      return 'Credenciais inválidas.';
    default:
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
}; 

export const sendInvite = async (
  idToken: string,
  email: string,
  technicianName: string,
  category: string
): Promise<AssignmentResult> => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/user/send-invite`,
      {
        email,
        technicianName,
        category,
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Erro ao enviar convite:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao enviar convite',
    };
  }
};

export const api = axios.create({
  baseURL: apiUrl,
}); 