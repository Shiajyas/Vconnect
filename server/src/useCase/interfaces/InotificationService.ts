export interface INotificationService {
    sendNotification(
      senderId: string,
      receiverIds: string[],
      type: "follow" | "unfollow" | "like" | "comment" | "mention" | "post",
      message: string,
      postId?: string
    ): Promise<void>;
  }
  