

type OtpEntry = {
  otp: string;
  userData: any;
  generatedAt: number;
};

export const tempStorage = new Map<string, OtpEntry>();
