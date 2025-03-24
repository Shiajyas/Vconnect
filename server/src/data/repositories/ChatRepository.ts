import { IChatRepository } from "../interfaces/IChatRepository";
import ChatModel from "../../core/domain/models/chatModel";
import MessageModel from "../../core/domain/models/messageModel";
import { IMessage } from "../../core/domain/interfaces/IMessage";
import { IChat } from "../../core/domain/interfaces/IChat";

export class ChatRepository implements IChatRepository {
  /**
   * Saves a message to the database.
   */
  async saveMessage(message: IMessage): Promise<IMessage> {
    const newMessage = new MessageModel(message);
    return await newMessage.save();
  }

  /**
   * Updates the last message in a chat.
   */
  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await ChatModel.findByIdAndUpdate(chatId, { lastMessage: messageId });
  }

  /**
   * Retrieves messages for a chat.
   */
  async getMessages(chatId: string): Promise<IMessage[]> {
    return await MessageModel.find({ chatId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Retrieves a chat by its ID.
   */
  async getChatById(chatId: string): Promise<IChat | null> {
    return await ChatModel.findById(chatId)
      .populate("users", "username email profilePicture")
      .exec();
  }

  /**
   * Creates a new chat for given users.
   */
  async createGroupChat(users: string[], isGroupChat: boolean = false): Promise<IChat> {
    const newChat = new ChatModel({ users, isGroupChat });
    return await newChat.save();
  }

  /**
   * Retrieves all chats for a user.
   */
  async getUserChats(userId: string): Promise<IChat[]> {
    return await ChatModel.find({ users: userId })
      .populate("users", "username email profilePicture")
      .exec();
  }

  /**
   * Retrieves or creates a one-to-one chat between two users.
   */
  async getOrCreateOneToOneChat(user1Id: string, user2Id: string): Promise<string> {
    try {
      // Check if chat exists between sender and receiver
      let chat = await ChatModel.findOne({
        users: { $all: [user1Id, user2Id] },
        isGroupChat: false,
      });

      // If chat does not exist, create a new one
      if (!chat) {
        chat = new ChatModel({
          users: [user1Id, user2Id],
          isGroupChat: false,
          createdAt: new Date(),
        });

        await chat.save();
      }

      return chat?._id;
    } catch (error) {
      console.error("Error in getOrCreateOneToOneChat:", error);
      throw new Error("Could not retrieve or create chat.");
    }
  }
}

export default new ChatRepository();
