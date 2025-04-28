export interface INormalizedMessage {
    _id: string;
    chatId: string;
    sender: {
      _id: string;
      username: string;
      avatar?: string;
    };
    receiverId?: string;
    content: string;
    replyTo?: {
      _id: string;
      content: string;
      sender: string;
    } | null;
    type: "text" | "image" | "video" | "file" | "link";
    createdAt: Date;
  }
  