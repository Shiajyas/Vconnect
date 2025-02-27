import express from "express";
import { UserController } from "../../controllers/UserController";
import userAuthMiddleware from "../../middleware/userAuthMiddleware";
import { UserService } from "../../../useCase/UserService";
import { SUserRepositoryImpl } from "../../../data/repositories/SUserRepositoryImpl";
import { UserRepository } from "../../../data/repositories/userRepository";



const router = express.Router();
const userRepositoryInstance = new UserRepository();
const RepositoryInstance = new SUserRepositoryImpl()

export function userRoutes() {
       const userServiceInstance = new UserService(userRepositoryInstance);
    const userController = new UserController(userServiceInstance);

    router.get("/suggestions", userAuthMiddleware.authenticate, userController.getSuggestions.bind(userController));


    return router;
}
