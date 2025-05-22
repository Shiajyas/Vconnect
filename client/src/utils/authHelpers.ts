import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  role: string;
  subscription: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
  exp: number;
}

// Decode the token and extract role
export const decodeToken = (token: string): object | null => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    // Check if the token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Invalid token:', error);
    return true;
  }
};
