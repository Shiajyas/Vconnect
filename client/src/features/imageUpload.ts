import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const imageUpload = async (images: File[], authToken: string) => {
  try {
    const formData = new FormData();

    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.images;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Image upload failed:', error.response?.data || error.message);
    } else {
      console.error('Image upload failed:', (error as any).message);
    }
    throw error;
  }
};
