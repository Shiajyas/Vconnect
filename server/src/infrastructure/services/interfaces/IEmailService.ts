export interface IEmailService{
    sendOtp(email: string,otp:string) : Promise<Boolean>
}