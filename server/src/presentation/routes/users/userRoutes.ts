import express from "express";
import { UserController } from "../../controllers/UserController";
import userAuthMiddleware from "../../middleware/userAuthMiddleware";
import { UserService } from "../../../useCase/UserService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { PostRepository } from "../../../data/repositories/PostRepository";
import { upload } from "../../middleware/uploadMiddleware";

const router = express.Router();
const userRepositoryInstance = new UserRepository();
const postRepositoryInstance = new PostRepository()
export function userRoutes() {
    const userServiceInstance = new UserService(userRepositoryInstance,postRepositoryInstance);
    const userController = new UserController(userServiceInstance);

    router.get("/suggestions", userAuthMiddleware.authenticate, userController.getSuggestions.bind(userController));

    router.get("/followers/:id", userAuthMiddleware.authenticate, userController.getFollowers.bind(userController));

    router.get("/following/:id", userAuthMiddleware.authenticate, userController.getFollowing.bind(userController));

    router.post("/unfollow/:id", userAuthMiddleware.authenticate, userController.unfollowUser.bind(userController));

    router.get("/profile/:id", userAuthMiddleware.authenticate, userController.getProfile.bind(userController));

    router.get("/post/:id", userAuthMiddleware.authenticate, userController.getUserPost.bind(userController));

    router.put("/profile/:id", 
        upload.single("avatar"),userAuthMiddleware.authenticate, (req, res, next) => {
        userController.updateUserprofile(req, res).then(() => next()).catch(next);
    });

    router.get("/profile/savedPost/:id", userAuthMiddleware.authenticate, userController.getUserSavedPost.bind(userController));

    return router;
}
