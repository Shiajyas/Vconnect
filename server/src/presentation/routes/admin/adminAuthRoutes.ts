import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { OtpService } from "../../../infrastructure/services/otpService";
import { IOtpService } from "../../../infrastructure/services/interfaces/IOtpService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { IUserRepository } from "../../../core/domain/interfaces/IUserRepository";
import { AuthService } from "../../../core/useCase/authOperations";
import { IAuthService} from "../../../core/useCase/interfaces/IAuthService";
import AuthMiddleware from "../../middleware/authMiddleware";

const router = Router();


const userRepository : IUserRepository = new UserRepository(); 
const otpService : IOtpService = new OtpService(); 

const userService : IAuthService = new AuthService(userRepository, otpService);

const authController = new AuthController(userService);

router.post("/login", authController.login.bind(authController));
router.get("/users",AuthMiddleware.authenticate, authController.getAllUser.bind(authController));


export default router;
