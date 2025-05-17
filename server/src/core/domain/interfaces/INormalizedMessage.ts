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
  files?: { url: string; name?: string; type?: string }[];
  replyTo?: {
    _id: string;
    content: string;
    sender: string;
  } | null;
  type: "text" | "image" | "video" | "file" | "link";
  createdAt: Date;
}
