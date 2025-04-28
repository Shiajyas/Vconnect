import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

let accessToken: string | null = null; // Keep latest token in memory

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach access token if available
axiosInstance.interceptors.request.use(
  async (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 errors and try to refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {}, { withCredentials: true });
        accessToken = refreshResponse.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest); // Retry original request
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Optional helper if you want to update token manually (after login)
export const setAccessToken = (token: string) => {
  accessToken = token;
};


export const fetchData = async (
  endpoint: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: Record<string, any>;
  },
  errorMessage: string
) => {
  try {
    const response = await axiosInstance.request({
      url: endpoint,
      method: options.method,
      data: options.data,
      params: options.params,
    });

    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error(`❌ ${errorMessage}`, errorData);
    throw new Error(errorData.msg || errorData.message);
  }
};
