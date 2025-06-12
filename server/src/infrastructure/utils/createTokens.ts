import jwt from 'jsonwebtoken';

// Function to create an access token
export const createAccessToken = (payload: {
  id: string;
  role: string;
  subscription: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
}): string =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '1d' });

// Function to create a refresh token
export const createRefreshToken = (payload: {
  id: string;
  role: string;
  subscription: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
}): string =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
