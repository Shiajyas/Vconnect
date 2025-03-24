export interface INotificationService {
    sendNotification(
      senderId: string,
      receiverIds: string[],
      type: "follow" | "unfollow" | "like" | "comment" | "mention" | "post"|"replay",
      message: string,
      postId?: string,
      senderName?: string
    ): Promise<void>;
  }
  