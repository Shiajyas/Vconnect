import { IChatService } from "./Interface/IChatService";
import IChatRepository from "../../../data/interfaces/IChatRepository";
import { Socket } from "socket.io";
import { IMessage } from "../../../core/domain/interfaces/IMessage";
import { IChat } from "../../../core/domain/interfaces/IChat";
import { Server } from "socket.io";
import { UserRepository } from "../../../data/repositories/userRepository";

export class ChatService implements IChatService {
  private io: Server;
  private chatRepository: IChatRepository;
  constructor(chatRepository: IChatRepository, ioInstance: Server) {
    this.chatRepository = chatRepository;
    this.io = ioInstance;
  }

  /**
   * Sends a message in a chat.
   */
  async sendMessage(socket: Socket, chatId: string, senderId: string, message: { message: string }): Promise<void> {
    try {
      // Fetch the chat to check if it's a group chat
      const chat = await this.chatRepository.getChatById(chatId);

      // console.log(chat, "chat from sendMessage");
      // console.log(chat, "chat from sendMessage");
      if (!chat) {
        socket.emit("error", { message: "Chat not found" });
        return;
      }
  
      // Determine receiverId (null for group chat, specific user for direct chat)
      let receiverId: string | null = null;
 
      if (!chat.isGroupChat) {
    
        const foundUser = chat.users.find((user: any) => {
          // console.log(user?._id.toString(), "user._id from sendMessage");
          // console.log(senderId, "senderId from sendMessage");
          // console.log(typeof user, "typeof user from sendMessage");
          return user?._id.toString() !== senderId;
        });
        receiverId = foundUser ? foundUser._id.toString() : null;
      }
      
  
      // Ensure message is a string
      if (typeof message?.message !== "string") {
        console.error("❌ messageError: Content must be a string");
        socket.emit("error", { message: "Message content must be a string" });
        return;
      }
  
      // Create a new message
      const newMessage = await this.chatRepository.saveMessage({
        chatId,
        senderId,
        receiverId, // ✅ Now correctly assigned
        content: message.message,
        type: "text",
      });
  
      // Update last message in chat
      await this.chatRepository.updateLastMessage(chatId, newMessage._id);
  
      // Emit the message to the chat room
      this.io.to(chatId).emit("messageReceived", newMessage);
      // this.io.emit("messageReceived", newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }
  
  
  
  /**
   * Saves a message to the database.
   */
  async saveMessage(message: IMessage): Promise<IMessage> {
    const savedMessage = await this.chatRepository.saveMessage(message);
    return {
      ...savedMessage,
      senderId: message.senderId,
      receiverId: message.receiverId,
      type: message.type,
    } as unknown as IMessage;
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
  async getMessages(socket:Socket, chatId: string, page: number, limit: number ): Promise<void>  {
    try {
      console.log("reached in get messages",chatId, page, limit);
      const messages = await this.chatRepository.getMessages(chatId, page, limit);
      console.log(messages, "messages from getMessages");
      // this.io.emit("messagesFetched", { messages });
      this.io.to(chatId).emit("messagesFetched", { messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", { message: "Failed to fetch messages" });
    }
  }

  /**
   * Retrieves a chat by its ID.
   */
  async getChatById(chatId: string): Promise<IChat | null> {
    const chat = await this.chatRepository.getChatById(chatId);
    if (chat) {
      return {
        ...chat,
        // Map or add missing properties to match the IChat interface
        updatedAt: new Date(), // Example: Replace with actual value
        $assertPopulated: () => {}, // Example: Replace with actual implementation
        $clearModifiedPaths: () => {}, // Example: Replace with actual implementation
        $clone: () => chat, // Example: Replace with actual implementation
        // Add other required properties here
      } as unknown as IChat;
    }
    return null;
  }

  /**
   * Creates a new chat for given users.
   */
  async createGroupChat(users: string[]): Promise<IChat> {
    const groupChat = await this.chatRepository.createGroupChat(users);
    return {
      ...groupChat,
      updatedAt: new Date(), // Example: Replace with actual value
      $assertPopulated: () => {}, // Example: Replace with actual implementation
      $clearModifiedPaths: () => {}, // Example: Replace with actual implementation
      $clone: () => groupChat, // Example: Replace with actual implementation
      // Add other required properties here
    } as unknown as IChat;
  }

  /**
   * Retrieves all chats for a user.
   */
  async getUserChats(socket: Socket, userId: { userId: string }): Promise<void> {
    console.log("reached in get user chats");
  
    try {
      const chats = await this.chatRepository.getUserChats(userId.userId); // ✅ Pass only the string
      console.log(chats, "???");
      this.io.emit("chatsList", { chats });
    } catch (error) {
      console.log("Error in ChatGateway.getUserChats:", error);
      this.handleError(socket, error, "getChatsError");
    }
  }
  

  async createChat(socket:Socket, userId: string, receiverId: string): Promise<void> {

    console.log("reached")
       try {
        let chat = await this.chatRepository.getOrCreateOneToOneChat(userId,receiverId)
        // socket.to(userId).emit("messageReceived", chatId);
        // socket.to(receiverId).emit("messageReceived", chatId);
        
        this.io.emit("chatCreated", { chat });
        // this.io.to(chatId).emit("chatCreated", { chat });
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
