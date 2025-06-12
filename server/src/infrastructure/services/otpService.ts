import emailService from './emailService';
import { IUser } from '../../core/domain/interfaces/IUser';
import { tempStorage } from '../utils/tempStorage';
import { IOtpService } from './interfaces/IOtpService';

export class OtpService implements IOtpService {
  private otpExpiryDuration = 90 * 1000; // 90 seconds

  generateOtp(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP GENERATED] Email: ${email}, OTP: ${otp}`);
    return otp;
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    try {
      const result = await emailService.sendOtp(email, otp);
      console.log(
        `[EMAIL SENT] Email: ${email}, OTP: ${otp}, Result: ${result}`,
      );
      return result;
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send OTP to ${email}:`, error);
      return false;
    }
  }

  async storeOtp(
    email: string,
    otp: string,
    newUserData: IUser,
  ): Promise<void> {
    const generatedAt = Date.now();

    // Merge with previous user data if it exists
    const existing = tempStorage.get(email);
    const mergedUserData = { ...existing?.userData, ...newUserData };

    tempStorage.set(email, { otp, userData: mergedUserData, generatedAt });
    console.log(
      `[OTP STORED] Email: ${email}, OTP: ${otp}, UserData:`,
      mergedUserData,
    );
  }

  verifyOtp(
    email: string,
    enteredOtp: string,
  ): { valid: boolean; expired: boolean } {
    const storedData = tempStorage.get(email);
    console.log(`[OTP VERIFICATION] Email: ${email}, Data:`, storedData);

    if (!storedData) return { valid: false, expired: false };

    const { otp, generatedAt } = storedData;
    const currentTime = Date.now();
    const isExpired = currentTime - generatedAt > this.otpExpiryDuration;

    if (isExpired) {
      tempStorage.delete(email);
      console.log(
        `[OTP EXPIRED] Email: ${email}, Expired At: ${new Date(currentTime).toISOString()}`,
      );
      return { valid: false, expired: true };
    }

    const isValid = enteredOtp === otp;
    console.log(
      `[OTP VALIDATION RESULT] Email: ${email}, Entered: ${enteredOtp}, Stored: ${otp}, Valid: ${isValid}`,
    );
    return { valid: isValid, expired: false };
  }

  getUserData(email: string): IUser {
    const storedData = tempStorage.get(email);
    console.log(`[FETCH USER DATA] Email: ${email}, Data:`, storedData);

    if (!storedData) {
      console.warn(`[USER DATA NOT FOUND] Possibly expired. Email: ${email}`);
      throw new Error('OTP session expired or not found.');
    }

    return storedData.userData;
  }

  debugOtpStorage(email: string): void {
    const stored = tempStorage.get(email);
    console.log(`[DEBUG] Stored OTP for ${email}:`, stored);
  }
}
