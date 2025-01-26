export const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();
