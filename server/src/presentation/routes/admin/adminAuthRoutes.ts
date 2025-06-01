import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { OtpService } from "../../../infrastructure/services/otpService";
import { IOtpService } from "../../../infrastructure/services/interfaces/IOtpService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { AuthService } from "../../../useCase/authOperations";
import { IAuthService} from "../../../useCase/interfaces/IAuthService";
import adminAuthMiddleware from "../../middleware/adminAuthMiddleware";
import { getAdminOverview, getMostLikedPosts , getReportedPosts, getReportedPostsCount} from "../../controllers/AdminOverviewController";
const router = Router();


const userRepository : IUserRepository = new UserRepository(); 
const otpService : IOtpService = new OtpService(); 

const userService : IAuthService = new AuthService(userRepository, otpService);

const authController = new AuthController(userService);

router.post("/login", authController.login.bind(authController));
router.get("/users",adminAuthMiddleware.authenticate, authController.getAllUser.bind(authController));
router.get("/user",adminAuthMiddleware.authenticate,authController.getUser.bind(authController))  
router.post("/users/:id/block", authController.blockUser.bind(authController));
router.post("/users/:id/unblock", authController.unblockUser.bind(authController));
router.post("/logout",authController.adminLogout.bind(authController))
router.get("/overview",adminAuthMiddleware.authenticate, getAdminOverview);
router.get( "/overview/most-liked",adminAuthMiddleware.authenticate,getMostLikedPosts);
router.get("/reports",adminAuthMiddleware.authenticate, getReportedPosts);
router.get("/reports/count",adminAuthMiddleware.authenticate, getReportedPostsCount);

export default router;
