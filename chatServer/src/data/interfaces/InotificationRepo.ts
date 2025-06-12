import { INotification } from '../../core/domain/interfaces/INotification';

export interface InotificationRepo {
  getUnreadCount(userId: string): Promise<number>;
  createNotification(notification: INotification): Promise<boolean>;
  markNotificationsAsRead(userId: string): Promise<void>;

  getNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: INotification[]; nextPage: number | null }>;

  deleteNotification(notificationId: string): Promise<void>;
}
