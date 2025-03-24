import { IChatService } from "./Interface/IChatService";
import { IChatRepository } from "../../../data/interfaces/IChatRepository";
import { Socket } from "socket.io";
import { IMessage } from "../../../core/domain/interfaces/IMessage";
import { IChat } from "../../../core/domain/interfaces/IChat";

export class ChatService implements IChatService {
  private chatRepository: IChatRepository;

  constructor(chatRepository: IChatRepository) {
    this.chatRepository = chatRepository;
  }

  /**
   * Sends a message in a chat.
   */
  async sendMessage(
    socket: Socket,
    messageData: {
      _id: string;
      chatId?: string;
      senderId: string;
      receiverId: string; 
      content: string;
      type: string;
      createdAt: string;
      replyTo?: string;
    }
  ): Promise<void> {
    try {
      let { chatId, senderId, receiverId, content, type, createdAt, replyTo } = messageData;
  
      // If chatId is not provided, check for an existing chat or create a new one
      if (!chatId) {
        chatId = await this.chatRepository.getOrCreateOneToOneChat(senderId, receiverId);
      }
  
      // Construct message object
      const newMessage = {
        _id: messageData._id,
        chatId,
        senderId,
        receiverId,
        content,
        type: type as "text" | "image" | "video" | "file",
        createdAt: new Date(createdAt),
        replyTo: replyTo || null,
      } as IMessage;
  
      // Save message in database
      const savedMessage = await this.chatRepository.saveMessage(newMessage);
  
      // Update last message in chat
      await this.chatRepository.updateLastMessage(chatId, savedMessage._id);
  
      // Emit the message to the chat room
      socket.to(chatId).emit("messageReceived", savedMessage);
    } catch (error) {
      console.error("Error in ChatGateway.sendMessage:", error);
      this.handleError(socket, error, "messageError");
    }
  }
  
  /**
   * Saves a message to the database.
   */
  async saveMessage(message: IMessage): Promise<IMessage> {
    return await this.chatRepository.saveMessage(message);
  }

  /**
   * Updates the last message in a chat.
   */
  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await this.chatRepository.updateLastMessage(chatId, messageId);
  }

  /**
   * Retrieves messages for a chat.
   */
  async getMessages(chatId: string): Promise<IMessage[]> {
    return await this.chatRepository.getMessages(chatId);
  }

  /**
   * Retrieves a chat by its ID.
   */
  async getChatById(chatId: string): Promise<IChat | null> {
    return await this.chatRepository.getChatById(chatId);
  }

  /**
   * Creates a new chat for given users.
   */
  async createGroupChat(users: string[]): Promise<IChat> {
    return await this.chatRepository.createGroupChat(users);
  }

  /**
   * Retrieves all chats for a user.
   */
  async getUserChats(userId: string): Promise<IChat[]> {
    return await this.chatRepository.getUserChats(userId);
  }

  async createChat(socket:Socket, userId: string, receiverId: string): Promise<void> {

    console.log("reached")
       try {
        let chatId = await this.chatRepository.getOrCreateOneToOneChat(userId,receiverId)
        socket.to(userId,receiverId).emit("messageReceived", chatId);
       } catch (error) {
        console.error("Error in ChatGateway.createChat:", error);
        this.handleError(socket, error, "messageError");
       }
  }

    private handleError(socket: Socket, error: unknown, event: string) {
      console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
      socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
    }
}
