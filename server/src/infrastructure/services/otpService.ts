import emailService from "./emailService";
import { IUser } from "../../core/domain/interfaces/IUser";
import { tempStorage } from "../utils/tempStorage";
import { IOtpService } from "./interfaces/IOtpService";


export class OtpService implements IOtpService {
  generateOtp(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const generatedAt = Date.now();
    
    tempStorage[email] = { otp, userData: { email } as IUser, generatedAt };
    
    return otp;
  }

  verifyOtp(email: string, enterdOtp: string): { valid: boolean, expired: boolean } {
    const storedData = tempStorage[email];

    // console.log(enterdOtp,"Enterd Otp");
    

    if (!storedData) {
      return { valid: false, expired: false };  
    }

    const { otp, generatedAt } = storedData;
    const currentTime = Date.now();
    const isExpired = currentTime - generatedAt > 90 * 1000;

    if (isExpired) {
      delete tempStorage[email]; 
      return { valid: false, expired: true };  
    }

    return { valid: enterdOtp === otp, expired: false }; 
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    try {
      const result = await emailService.sendOtp(email, otp);
      return result;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return false;
    }
  }

  async storeOtp(email: string, otp: string, userData: IUser) {
    tempStorage[email] = { otp, userData, generatedAt: Date.now() };
  }
  getUserData(email: string): IUser {
    const storedData = tempStorage[email];
    if (!storedData) {
      throw new Error("OTP session expired or not found.");
    }

    return storedData.userData;
  }
}
