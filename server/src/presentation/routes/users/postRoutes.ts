import { Router, Request, Response, NextFunction } from "express";
import { PostController } from "../../controllers/PostController";
import { PostService } from "../../../useCase/postOperations";
import { IPostService } from "../../../useCase/interfaces/IPostService";
import { PostRepository } from "../../../data/repositories/PostRepository";
import { IPostRepository } from "../../../data/interfaces/IPostRepository";
import AuthMiddleware from "../../middleware/authMiddleware";
import { upload } from "../../middleware/uploadMiddleware";
import { SocketHandlers } from "../../../useCase/socketHandlers";
import { UserRepository } from "../../../data/repositories/userRepository";
import { SUserRepositoryImpl } from "../../../data/repositories/SUserRepositoryImpl";
import { NotificationServiceImpl } from "../../../infrastructure/services/NotificationServiceImpl";
import { ISUserRepository } from "../../../data/interfaces/ISUserRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { AuthenticatedRequest } from "../../../core/domain/interfaces/IAuthenticatedRequest";

const router = Router();

// Initialize repositories and services
const postRepository: IPostRepository = new PostRepository();
const userRepository: ISUserRepository = new SUserRepositoryImpl();
const notificationService = new NotificationServiceImpl();
const mainUserRepository: IUserRepository = new UserRepository();
// const socketHandlers = new SocketHandlers(userRepository, mainUserRepository, notificationService, someAdditionalArgument);
const postService: IPostService = new PostService(postRepository);
const postController = new PostController(postService);

// Routes
router.post(
    "/upload",
    AuthMiddleware.authenticate,
    upload.array("mediaUrls", 5), // Accepts both images and videos
    (req: Request, res: Response, next: NextFunction) => postController.createPost(req as unknown as AuthenticatedRequest, res).catch(next)
);

router.get("/", AuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.getPosts(req as unknown as AuthenticatedRequest, res).catch(next));
router.get("/:id", (req: Request, res: Response, next: NextFunction) => postController.getPost(req as unknown as AuthenticatedRequest, res).catch(next));

router.put(
    "/:id",
    AuthMiddleware.authenticate,
    upload.array("file", 5), // Accepts both images and videos
    (req: Request, res: Response, next: NextFunction) => postController.updatePost(req as unknown as AuthenticatedRequest, res).catch(next)
);

router.delete("/:id", AuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.deletePost(req as unknown as AuthenticatedRequest, res).catch(next));

router.post("/:id/like", AuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.likePost(req as unknown as AuthenticatedRequest, res).catch(next));
router.post("/:id/unlike", AuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.unlikePost(req as unknown as AuthenticatedRequest, res).catch(next));

router.get("/user/:id", (req: Request, res: Response, next: NextFunction) => postController.getUserPosts(req as any, res).catch(next));
router.post("/:id/report", AuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.reportPost(req as unknown as AuthenticatedRequest, res).catch(next));

export default router;
