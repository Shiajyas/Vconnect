import { IUser } from "../../domain/interfaces/IUser";

export interface IAuthService {
  requestOtp: any;
  register(user: IUser): Promise<void>;
  verifyOtp(email: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }>;
  createUser(user: IUser): Promise<IUser>;
  getUser(userId : unknown) : Promise<{user: IUser}>
  login(email: string, password: string, role: "user" | "admin"): Promise<{ token: string; user: IUser;refreshToken: string;  } | null>
  verify_Otp(email: string, enterdOtp: string): Promise<{ userData: IUser }>
  resendOtp(email: string): Promise<boolean>;
  resetPassword(email: string, newPassword: string): Promise<boolean>;
  getAllUser(query: object): Promise<IUser[]>
  googleAuth(idToken: string): Promise<{ user: IUser; token: string }>;
  refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string; role: string }>;
  generateTokens(user: {
    id: string;
    role: string;
    subscription: {
      isActive: boolean;
      startDate: Date;
      endDate: Date;
    };
  }): { accessToken: string; refreshToken: string };
  
}
