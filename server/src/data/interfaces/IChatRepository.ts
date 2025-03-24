import { IMessage } from "../../core/domain/interfaces/IMessage";
import { IChat } from "../../core/domain/interfaces/IChat";

export interface IChatRepository {
  /**
   * Saves a message to the database.
   */
  saveMessage(message: IMessage): Promise<IMessage>;

  /**
   * Updates the last message in a chat.
   */
  updateLastMessage(chatId: string, messageId: string): Promise<void>;

  /**
   * Retrieves messages for a given chat.
   */
  getMessages(chatId: string): Promise<IMessage[]>;

  /**
   * Retrieves chat details by its ID.
   */
  getChatById(chatId: string): Promise<IChat | null>;

  /**
   * Creates a new one-on-one chat if it doesn't exist.
   */
  getOrCreateOneToOneChat(user1Id: string, user2Id: string): Promise<string>;

  /**
   * Retrieves all chats a user is part of.
   */
  getUserChats(userId: string): Promise<IChat[]>;

  /**
   * Creates a new chat for given users (can be group or one-on-one).
   */
  createGroupChat(users: string[], isGroupChat?: boolean): Promise<IChat>;
}
