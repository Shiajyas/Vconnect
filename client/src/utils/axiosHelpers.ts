import axios, { AxiosInstance } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;

// Create an Axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for sending HTTP-only cookies
});

// Utility to get default headers with optional authorization
export const getDefaultHeaders = (isAuthRequired: boolean = false, tokenKey?: string) => {
  const headers: Record<string, string> = {};

  if (isAuthRequired && tokenKey) {
    const token = localStorage.getItem(tokenKey);
    if (!token) throw new Error("Access token is missing.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Utility to decode token and get expiration time
export const getTokenExpiry = (token: string): number | null => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// Refresh token service to handle token expiration
export const refreshAccessToken = async () => {
  try {
    const response = await axiosInstance.post("/refresh-token");
    const { accessToken, role } = response.data;

    // Update the access token in localStorage
    if (role === "admin") {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.setItem("userToken", accessToken);
    }

    return accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw new Error("Session expired. Please log in again.");
  }
};

// Utility function for handling API requests
// fetchData utility
export const fetchData = async (
  endpoint: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    data?: any;
    isAuthRequired?: boolean;
    tokenKey?: string;
    params?: Record<string, any>; 
  },
  errorMessage: string
) => {
  try {
    const { method, data, isAuthRequired, tokenKey, params } = options;

    // Check if the token needs to be refreshed
    if (isAuthRequired && tokenKey) {
      const token = localStorage.getItem(tokenKey);

      if (token) {
        const expiryTime = getTokenExpiry(token);
        const currentTime = Math.floor(Date.now() / 1000);

        // Refresh the token if it will expire in the next 5 minutes
        if (expiryTime && expiryTime - currentTime <= 300) {
          console.warn("Token is about to expire. Refreshing...");
          await refreshAccessToken();
        }
      }
    }

    // Make the API request
    const response = await axiosInstance.request({
      url: endpoint,
      method,
      data,
      params, 
      headers: getDefaultHeaders(isAuthRequired, tokenKey),
    });

    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error(errorMessage, errorData);
    throw new Error(errorData.message || errorMessage);
  }
};