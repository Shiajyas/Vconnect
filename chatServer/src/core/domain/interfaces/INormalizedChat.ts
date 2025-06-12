export interface INormalizedChat {
  _id: string;
  users: {
    _id: string;
    username: string;
    avatar?: string;
  }[];
  lastMessage?: {
    _id: string;
    content: string;
    sender: string;
    type: 'text' | 'image' | 'video' | 'file' | 'link';
    files?: { url: string; name?: string; type?: string }[];
  } | null;
  isGroupChat: boolean;
  createdAt: Date;
}
