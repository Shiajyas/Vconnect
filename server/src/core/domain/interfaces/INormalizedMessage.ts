export interface INormalizedMessage {
    _id: string;
    chatId: string;
    sender: {
      _id: string;
      username: string;
      avatar?: string;
    };
    content: string;
    replyTo?: {
      _id: string;
      content: string;
      sender: string;
    } | null;
    createdAt: Date;
  }
  