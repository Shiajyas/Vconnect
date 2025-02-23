import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { OtpService } from "../../../infrastructure/services/otpService";
import { IOtpService } from "../../../infrastructure/services/interfaces/IOtpService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { AuthService } from "../../../useCase/authOperations";
import { IAuthService } from "../../../useCase/interfaces/IAuthService";
import AuthMiddleware from "../../middleware/authMiddleware";
import { loginRateLimiter } from "../../middleware/rateLimitMiddleware";

const router = Router();


const userRepository : IUserRepository = new UserRepository(); 
const otpService : IOtpService = new OtpService(); 

const userService : IAuthService = new AuthService(userRepository, otpService);

const authController = new AuthController(userService);

router.post("/register", authController.register.bind(authController));
router.post("/verify_otp", authController.verifyOtp.bind(authController));
router.get("/user",AuthMiddleware.authenticate,authController.getUser.bind(authController))  
router.post("/login",loginRateLimiter, authController.login.bind(authController));
router.post("/request_otp", authController.requestOtp.bind(authController))
router.post("/verify_otpf", authController.verify_Otp.bind(authController))
router.post("/resend_otp", authController.resendOtp.bind(authController))
router.post("/reset_password",authController.resetPassword.bind(authController))
router.post("/google",authController.googleAuth.bind(authController))
router.post("/refresh-token",authController.refreshToken.bind(authController))
router.post("/logout",authController.logout.bind(authController))



export default router;
