import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { OtpService } from "../../../infrastructure/services/otpService";
import { IOtpService } from "../../../infrastructure/services/interfaces/IOtpService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { AuthService } from "../../../useCase/authOperations";
import { IAuthService} from "../../../useCase/interfaces/IAuthService";
import AuthMiddleware from "../../middleware/authMiddleware";

const router = Router();


const userRepository : IUserRepository = new UserRepository(); 
const otpService : IOtpService = new OtpService(); 

const userService : IAuthService = new AuthService(userRepository, otpService);

const authController = new AuthController(userService);

router.post("/login", authController.login.bind(authController));
router.get("/users",AuthMiddleware.authenticate, authController.getAllUser.bind(authController));

router.post("/users/:id/block", authController.blockUser.bind(authController));
router.post("/users/:id/unblock", authController.unblockUser.bind(authController));



export default router;
