import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { IEmailService } from './interfaces/IEmailService';

class EmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.EMAIL_PORT || 465),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'a62824d9e0698c',
        pass: process.env.EMAIL_PASSWORD || '1b024f9b30a7e4',
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    try {
      const mailOptions: SendMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Account ✔',
        text: `Your OTP is ${otp}`,
        html: `<b><h4>Your OTP is ${otp}</h4><br><a href="#">Click here</a></b>`,
      };

      // Send the email
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }
}

export default new EmailService();
