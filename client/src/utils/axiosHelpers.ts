import axios, { AxiosInstance } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import Cookies from "js-cookie"; // Install using: npm install js-cookie

const API_URL = import.meta.env.VITE_API_URL;

// Create an Axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensures cookies are included in requests
});

// Function to get default headers with Authorization
export const getDefaultHeaders = async () => {
  const headers: Record<string, string> = {};
  return headers;
};

// Decode JWT token to check expiration
export const getTokenExpiry = (token: string): number | null => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp || null;
  } catch (error) {
    console.error("❌ Failed to decode token:", error);
    return null;
  }
};

// Refresh access token
export const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axiosInstance.post("/refresh-token"); // Refresh token from backend
    const { accessToken } = response.data;

    console.log("🔄 New Access Token Received");

    return accessToken; // Token is already stored in HTTP-only cookies, no need for manual storage
  } catch (error) {
    console.error("❌ Failed to refresh access token:", error);
    throw new Error("Session expired. Please log in again.");
  }
};

// Fetch Data Utility
export const fetchData = async (
  endpoint: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  },
  errorMessage: string
) => {
  try {
    const { method, data, } = options; // Default to userToken
    const headers = await getDefaultHeaders();

    const response = await axiosInstance.request({
      url: endpoint,
      method,
      data,
      params: options.params,
      headers,
    });

    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error(`❌ ${errorMessage}`, errorData);
    throw new Error(errorData.msg || errorData.message);
  }
};

