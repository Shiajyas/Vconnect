import { INormalizedChat } from '../../core/domain/interfaces/INormalizedChat';
import { INormalizedMessage } from '../../core/domain/interfaces/INormalizedMessage';
import { IMessage } from '../../core/domain/interfaces/IMessage';

export default interface IChatService {
  saveMessage(message: Partial<IMessage>): Promise<INormalizedMessage>;
  updateLastMessage(chatId: string, messageId: string): Promise<void>;
  getMessages(
    chatId: string,
    page?: number,
    limit?: number,
  ): Promise<INormalizedMessage[]>;
  createGroupChat(
    users: string[],
    isGroupChat?: boolean,
  ): Promise<INormalizedChat>;
  getOrCreateOneToOneChat(
    user1Id: string,
    user2Id: string,
  ): Promise<INormalizedChat>;
  getUserChats(userId: string): Promise<INormalizedChat[]>;
  getChatById(chatId: string): Promise<INormalizedChat | null>;
  deleteMessage(messageId: string): Promise<void>;
  editMessage(
    messageId: string,
    newContent: string,
  ): Promise<INormalizedMessage>;
}
