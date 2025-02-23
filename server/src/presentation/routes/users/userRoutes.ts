import express from "express";
import { UserController } from "../../controllers/UserController";
import AuthMiddleware from "../../middleware/authMiddleware";
import { UserService } from "../../../useCase/UserService";
import { Server } from "socket.io";
import { SUserRepositoryImpl } from "../../../data/repositories/SUserRepositoryImpl";
import { SocketHandlers } from "../../../useCase/socketHandlers";
import { NotificationService } from "../../../infrastructure/services/interfaces/INotificationService";
import { UserRepository } from "../../../data/repositories/userRepository";
import { NotificationServiceImpl } from "../../../infrastructure/services/NotificationServiceImpl";



const router = express.Router();
const userRepositoryInstance = new UserRepository();
const RepositoryInstance = new SUserRepositoryImpl()

export function userRoutes() {
       const userServiceInstance = new UserService(userRepositoryInstance);
    const userController = new UserController(userServiceInstance);

    router.get("/suggestions", AuthMiddleware.authenticate, userController.getSuggestions.bind(userController));


    return router;
}
