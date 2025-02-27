import { Router, Request, Response, NextFunction } from "express";
import { PostController } from "../../controllers/PostController";
import { PostService } from "../../../useCase/postOperations";
import { IPostService } from "../../../useCase/interfaces/IPostService";
import { PostRepository } from "../../../data/repositories/PostRepository";
import { IPostRepository } from "../../../data/interfaces/IPostRepository";
import userAuthMiddleware from "../../middleware/userAuthMiddleware";
import { upload } from "../../middleware/uploadMiddleware";
import { AuthenticatedRequest } from "../../../core/domain/interfaces/IAuthenticatedRequest";

const router = Router();

// Initialize repositories and services
const postRepository: IPostRepository = new PostRepository();
const postService: IPostService = new PostService(postRepository);
const postController = new PostController(postService);

// Routes
router.post(
    "/upload",
    userAuthMiddleware.authenticate,
    upload.array("mediaUrls", 5), // Accepts both images and videos
    (req: Request, res: Response, next: NextFunction) => postController.createPost(req as unknown as AuthenticatedRequest, res).catch(next)
);

router.get("/", userAuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.getPosts(req as unknown as AuthenticatedRequest, res).catch(next));
router.get("/:id", (req: Request, res: Response, next: NextFunction) => postController.getPost(req as unknown as AuthenticatedRequest, res).catch(next));

router.put(
    "/:id",
    userAuthMiddleware.authenticate,
    upload.array("file", 5), // Accepts both images and videos
    (req: Request, res: Response, next: NextFunction) => postController.updatePost(req as unknown as AuthenticatedRequest, res).catch(next)
);

router.delete("/:id", userAuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.deletePost(req as unknown as AuthenticatedRequest, res).catch(next));

router.patch("/:id/like",userAuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.likePost(req as unknown as AuthenticatedRequest, res).catch(next));
router.patch("/:id/unlike", userAuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.unlikePost(req as unknown as AuthenticatedRequest, res).catch(next));

router.get("/user/:id", (req: Request, res: Response, next: NextFunction) => postController.getUserPosts(req as any, res).catch(next));
router.post("/:id/report", userAuthMiddleware.authenticate, (req: Request, res: Response, next: NextFunction) => postController.reportPost(req as unknown as AuthenticatedRequest, res).catch(next));

export default router;
