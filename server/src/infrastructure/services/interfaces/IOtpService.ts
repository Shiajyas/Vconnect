import { IUser } from "../../../core/domain/interfaces/IUser";

export interface IOtpService {
    sendOtpEmail(email: string, otp: string): unknown;
    getUserData(email: string): unknown;
    generateOtp(email: string): string;
    verifyOtp(email: string, enteredOtp: string): { valid: boolean; expired: boolean };
    storeOtp(email: string, otp: string, userData: IUser): unknown
  }
  