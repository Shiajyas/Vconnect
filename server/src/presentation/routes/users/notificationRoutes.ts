import { Router } from "express";
import AuthMiddleware from "../../middleware/authMiddleware";
import { UserRepository } from "../../../data/repositories/userRepository";
import { NotificationRepo } from "../../../data/repositories/notificationRepo";
import { NotificationController } from "../../controllers/notificationController";

const router = Router();

const userRepository = new UserRepository();
const notificationRepository = new NotificationRepo();

const notificationController = new NotificationController(userRepository, notificationRepository);

// Fetch unread notification count
router.get("/unreadcount/:id", AuthMiddleware.authenticate, (req, res) =>
    notificationController.getUnreadCount(req, res)
);

// Mark notifications as read
router.post("/mark-as-read/:id", AuthMiddleware.authenticate, (req, res) =>
    notificationController.markNotificationsAsRead(req, res)
);

// Fetch paginated notifications
router.get("/", AuthMiddleware.authenticate, async (req, res) => {
    await notificationController.getNotifications(req, res);
});

// Delete a notification
router.delete("/:notificationId", AuthMiddleware.authenticate, async (req, res) => {
    await notificationController.deleteNotification(req, res);
});

export default router;
