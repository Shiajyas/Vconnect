import axios, { AxiosInstance } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;

// Create an Axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Function to get default headers with Authorization
export const getDefaultHeaders = async (isAuthRequired: boolean = false, tokenKey: string = "userToken") => {
  const headers: Record<string, string> = {};

  if (isAuthRequired) {
    let token = localStorage.getItem(tokenKey);
    
    if (token) {
      const expiryTime = getTokenExpiry(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (expiryTime && expiryTime - currentTime <= 300) {
        console.warn("🔄 Token is about to expire. Refreshing...");
        token = await refreshAccessToken();
      }
    }

    if (!token) {
      console.error("🚨 Access token is missing.");
      throw new Error("Access token is missing.");
    }

    headers["Authorization"] = `Bearer ${token}`;
  }

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
    const response = await axiosInstance.post("/refresh-token");
    const { accessToken, role } = response.data;

    console.log("🔄 New Access Token Received");

    // Ensure token is saved correctly
    if (role === "admin") {
      localStorage.setItem("adminToken", accessToken);
    } else {
      localStorage.setItem("userToken", accessToken);
    }

    return accessToken;
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
    isAuthRequired?: boolean;
    tokenKey?: string;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  },
  errorMessage: string
) => {
  try {
    const { method, data, isAuthRequired, tokenKey } = options;
    const headers = await getDefaultHeaders(isAuthRequired, tokenKey || "userToken");

    // console.log(`📡 Request to: ${endpoint}`, { method, headers, data });

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
