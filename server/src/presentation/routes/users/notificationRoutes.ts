import { Router } from 'express';
import userAuthMiddleware from '../../middleware/userAuthMiddleware';
import { UserRepository } from '../../../data/repositories/userRepository';
import { NotificationRepo } from '../../../data/repositories/notificationRepo';
import { NotificationController } from '../../controllers/notificationController';

const router = Router();

const userRepository = new UserRepository();
const notificationRepository = new NotificationRepo();

const notificationController = new NotificationController(
  userRepository,
  notificationRepository,
);

// Fetch unread notification count
router.get('/unreadcount/:id', userAuthMiddleware.authenticate, (req, res) =>
  notificationController.getUnreadCount(req, res),
);

// Mark notifications as read
router.post('/mark-as-read/:id', userAuthMiddleware.authenticate, (req, res) =>
  notificationController.markNotificationsAsRead(req, res),
);

// Fetch paginated notifications
router.get('/', userAuthMiddleware.authenticate, async (req, res) => {
  await notificationController.getNotifications(req, res);
});

// Delete a notification
router.delete(
  '/:notificationId',
  userAuthMiddleware.authenticate,
  async (req, res) => {
    await notificationController.deleteNotification(req, res);
  },
);

export default router;
