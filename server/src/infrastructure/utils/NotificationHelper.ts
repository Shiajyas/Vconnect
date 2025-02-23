export class NotificationHelper {
    static createNotification(
      recipient: string,
      sender: string,
      message: string,
      type: string,
      relatedPost?: string
    ) {
      return {
        recipient,
        sender,
        message,
        type,
        relatedPost,
        createdAt: new Date(),
      };
    }
  }
  