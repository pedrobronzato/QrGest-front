import { apiUrl } from '@/config/apiUrl';
import axios from 'axios';

export const api = axios.create({
  baseURL: apiUrl,
});

export interface UploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

export const uploadImages = async (
  uris: string[],
  idToken?: string
): Promise<UploadResult> => {
  try {
    const uploadPromises = uris.map(async (uri) => {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);

     console.log(JSON.stringify(formData), 'formData');

      const response = await api.post(
        '/api/image',
        formData,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            ...(idToken && { Authorization: `Bearer ${idToken}` })
          },
        }
      );

      console.log(response.data, 'response');
      
      return response.data.urls[0];
    });

    const urls = await Promise.all(uploadPromises);
    
    return {
      success: true,
      urls: urls,
    };
  } catch (error: any) {
    console.error("Upload failed", error);
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao fazer upload das imagens',
    };
  }
};    