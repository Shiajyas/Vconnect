

import { NotificationService } from "./interfaces/INotificationService";

export class NotificationServiceImpl implements NotificationService {
  sendNotification(recipients: string[], message: any): void {
    // Here we can send notifications, for instance, using external services (e.g., email, push notifications)
    // For this example, we'll just print to the console
    console.log("Sending notification to", recipients);
    console.log("Message:", message);
  }
}
