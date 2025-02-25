import { InotificationRepo } from "../interfaces/InotificationRepo";
import { INotification } from "../../core/domain/interfaces/INotification";
import { Notification } from "../../core/domain/models/NotificationModel";

export class NotificationRepo implements InotificationRepo {
    // Create a new notification
    async createNotification(notification: INotification): Promise<boolean> {
        try {
            await Notification.create(notification);
            return true;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw new Error("Failed to create notification");
        }
    }

    // Get unread notification count
    async getUnreadCount(userId: string): Promise<number> {
        try {
            return await Notification.countDocuments({ receiverId: { $in: [userId] }, isRead: false });
        } catch (error) {
            console.error("Error fetching unread count:", error);
            throw new Error("Failed to fetch unread notification count");
        }
    }

    // Mark notifications as read
    async markNotificationsAsRead(userId: string): Promise<void> {
        try {
            await Notification.updateMany(
                { receiverId: { $in: [userId] }, isRead: false },
                { $set: { isRead: true } }
            );
        } catch (error) {
            console.error("Error updating notifications:", error);
            throw new Error("Failed to update notifications");
        }
    }

    // Fetch paginated notifications
    async getNotifications(userId: string, page: number, limit: number): Promise<{ notifications: INotification[]; nextPage: number | null; }> {
        try {
            // Fetch notifications where the user is in the receiverId array
            const notifications = await Notification.find({ receiverId: { $in: [userId] } })
                .sort({ createdAt: -1 }) // Latest first
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

            // Mark fetched unread notifications as read
            await Notification.updateMany(
                { receiverId: { $in: [userId] }, isRead: false }, 
                { $set: { isRead: true } }
            );

            // Calculate nextPage correctly
            const totalNotifications = await Notification.countDocuments({ receiverId: { $in: [userId] } });
            const nextPage = (page * limit) >= totalNotifications ? null : page + 1;

            return { notifications, nextPage };
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw new Error("Failed to fetch notifications");
        }
    }
    
    // Delete a notification
    async deleteNotification(notificationId: string): Promise<void> {
        try {
            await Notification.findByIdAndDelete(notificationId);
        } catch (error) {
            console.error("Error deleting notification:", error);
            throw new Error("Failed to delete notification");
        }
    }
}
