import { Socket } from "socket.io";
import { IMessage } from "../../../../core/domain/interfaces/IMessage";
import { IChat } from "../../../../core/domain/interfaces/IChat";

export interface IChatService {
  /**
   * Sends a message in a chat.
   */
 sendMessage(socket:Socket,chatId:string, senderId: string, message: object): Promise<void>
  /**
   * Saves a message to the database.
   */
  saveMessage(message: IMessage): Promise<IMessage>;

  /**
   * Updates the last message in a chat.
   */
  updateLastMessage(chatId: string, messageId: string): Promise<void>;

  /**
   * Retrieves messages for a chat.
   */
  getMessages(socket:Socket, chatId: string, page: number, limit: number ): Promise<void> 

  /**
   * Retrieves a chat by its ID.
   */
  getChatById(chatId: string): Promise<IChat | null>;

  /**
   * Creates a new chat for given users.
   */
  createGroupChat(users: string[]): Promise<IChat>;

  /**
   * Retrieves all chats for a user.
   */
  getUserChats(socket: Socket, userId: { userId: string }): Promise<void> 
   /**
   * Create one to one chat.
   */

   createChat(socket:Socket, userId: string, receiverId: string): Promise <void>
}
