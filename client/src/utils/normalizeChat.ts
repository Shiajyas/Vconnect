export interface NormalizedChat {
    _id: string;
    users: { _id: string; username: string; avatar?: string }[];
    isGroupChat: boolean;
    groupName?: string;
    groupAvatar?: string;
    createdAt: string;
    lastMessage?: {
      _id: string;
      text: string;
      senderId: string;
      createdAt: string;
    };
  }

  export const normalizeChat = (chat: any): NormalizedChat => {
    // console.log("📥 Normalizing chat data:", JSON.stringify(chat, null, 2));
  
    const normalizedChat: NormalizedChat = {
      _id: chat._id,
      users:
        chat.users?.map((user: any) => ({
          _id: user._id,
          username: user.username, // ✅ Changed from 'name' to 'username'
          avatar: user.avatar || "",
        })) || [],
      isGroupChat: chat.isGroupChat || false,
      groupName: chat.groupName || undefined,
      groupAvatar: chat.groupAvatar || undefined,
      createdAt: chat.createdAt || new Date().toISOString(),
      lastMessage: chat.lastMessage
        ? {
            _id: chat.lastMessage._id,
            text: chat.lastMessage.content,
            senderId: chat.lastMessage.senderId,
            createdAt: chat.lastMessage.createdAt,
          }
        : undefined,
    };
  
    // console.log("✅ Normalized chat data:", JSON.stringify(normalizedChat, null, 2));
  
    // return normalizedChat;

    return chat
  };
  
  