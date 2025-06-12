import IChatRepository from '../interfaces/IChatRepository';
import ChatModel from '../../core/domain/models/chatModel';
import MessageModel from '../../core/domain/models/messageModel';
import { IMessage } from '../../core/domain/interfaces/IMessage';
import { IChat } from '../../core/domain/interfaces/IChat';
import { INormalizedChat } from '../../core/domain/interfaces/INormalizedChat';
import { INormalizedMessage } from '../../core/domain/interfaces/INormalizedMessage';
import { ISUserRepository } from '../interfaces/ISUserRepository';
import mongoose from 'mongoose';

export class ChatRepository implements IChatRepository {
  /**
   * Saves a message to the database and returns the normalized message.
   */
  async saveMessage(message: Partial<IMessage>): Promise<INormalizedMessage> {
    try {
      console.log(message, 'for send messageLast');

      const newMessage = new MessageModel(message);
      const savedMessage = await newMessage.save();

      // Populate sender and replyTo details
      await savedMessage.populate([
        { path: 'senderId', select: 'username avatar' },
        {
          path: 'replyTo',
          select: 'content senderId',
          populate: { path: 'senderId', select: 'username avatar' },
        },
      ]);

      console.log(savedMessage, 'savedMessage from chatRepository');

      return {
        _id: savedMessage._id,
        chatId: savedMessage.chatId,
        sender: {
          _id: savedMessage.senderId,
          username: (savedMessage.senderId as any).username,
          avatar: (savedMessage.senderId as any).avatar,
        },
        receiverId: savedMessage?.receiverId ?? undefined,
        content: savedMessage.content,
        type: savedMessage?.type || 'text',
        files: savedMessage.files || [], // ✅ Include files in the return
        replyTo: savedMessage.replyTo
          ? {
              _id:
                typeof savedMessage.replyTo === 'object'
                  ? savedMessage.replyTo._id
                  : savedMessage.replyTo,
              content:
                typeof savedMessage.replyTo === 'object'
                  ? savedMessage.replyTo.content || ''
                  : '',
              sender:
                typeof savedMessage.replyTo === 'object' &&
                'senderId' in savedMessage.replyTo
                  ? (savedMessage.replyTo.senderId as any)._id ||
                    savedMessage.replyTo.senderId
                  : '',
            }
          : null,
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Updates the last message in a chat.
   */
  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await ChatModel.findByIdAndUpdate(
      chatId,
      { lastMessage: messageId },
      { new: true },
    );
  }

  /**
   * Retrieves paginated messages for a chat.
   */
  async getMessages(
    chatId: string,
    page: number = 0,
    limit: number = 20,
  ): Promise<INormalizedMessage[]> {
    const objectId = new mongoose.Types.ObjectId(chatId);

    const messages = await MessageModel.find({ chatId: objectId })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate('senderId', 'username avatar')
      .populate('replyTo', 'content senderId')
      .exec();

    return messages.map((msg) => ({
      _id: msg._id,
      chatId: msg.chatId,
      sender: {
        _id: msg.senderId,
        username: (msg.senderId as any).username,
        avatar: (msg.senderId as any).avatar,
      },
      content: msg.content,
      type: msg.type || 'text',
      files: msg.files || [], // ✅ Include files in response
      replyTo: msg.replyTo
        ? {
            _id:
              typeof msg.replyTo === 'object' ? msg.replyTo._id : msg.replyTo,
            content:
              typeof msg.replyTo === 'object' ? msg.replyTo.content || '' : '',
            sender:
              typeof msg.replyTo === 'object' && 'senderId' in msg.replyTo
                ? ((msg.replyTo.senderId as any)?._id?.toString() ??
                  msg.replyTo.senderId.toString())
                : '',
          }
        : null,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Creates a group chat.
   */
  async createGroupChat(
    users: string[],
    isGroupChat: boolean = false,
  ): Promise<INormalizedChat> {
    const newChat = new ChatModel({ users, isGroupChat });
    const chat = await newChat.save();

    // Populate users
    await chat.populate({ path: 'users', select: 'username avatar' });

    return {
      _id: chat._id,
      users: chat.users.map((user: any) => ({
        _id: user._id || user, // Use user directly if it's a string (user ID)
        username:
          typeof user === 'object' &&
          user !== null &&
          'username' in (user as { username: string })
            ? (user as { username: string }).username
            : '',
        avatar:
          typeof user === 'object' &&
          user !== null &&
          'avatar' in (user as { avatar: string })
            ? (user as { avatar: string }).avatar
            : '',
      })),
      isGroupChat: chat.isGroupChat,
      createdAt: chat.createdAt,
    };
  }

  /**
   * Retrieves or creates a one-to-one chat between two users.
   */
  async getOrCreateOneToOneChat(
    user1Id: string,
    user2Id: string,
  ): Promise<INormalizedChat> {
    try {
      // Check if chat already exists
      let chat = await ChatModel.findOne({
        users: { $all: [user1Id, user2Id] },
        isGroupChat: false,
      }).populate('users', 'username avatar');

      if (!chat) {
        // Remove duplicate users before saving
        const uniqueUsers = Array.from(new Set([user1Id, user2Id]));

        chat = new ChatModel({
          users: uniqueUsers,
          isGroupChat: false,
          createdAt: new Date(),
        });

        await chat.save();
        chat = await chat.populate('users', 'username avatar'); // Ensure users are populated after saving
      }
      //  console.log(chat, "chat from getOrCreateOneToOneChat");
      return {
        _id: chat._id.toString(),
        users: chat.users.map((user) => ({
          _id:
            typeof user === 'object' && user !== null && '_id' in user
              ? (user as { _id: string })._id.toString()
              : user,
          username:
            typeof user === 'object' &&
            user !== null &&
            'username' in (user as { username: string })
              ? (user as { username: string }).username
              : '',
          avatar:
            typeof user === 'object' &&
            user !== null &&
            'avatar' in (user as { avatar: string })
              ? (user as { avatar: string }).avatar
              : '',
        })),
        isGroupChat: chat.isGroupChat,
        createdAt: chat.createdAt,
      };
    } catch (error) {
      console.error('❌ Error in getOrCreateOneToOneChat:', error);
      throw new Error('Could not retrieve or create chat.');
    }
  }

  /**
   * Retrieves all chats for a user.
   */
  async getUserChats(userId: string): Promise<INormalizedChat[]> {
    const objectId = new mongoose.Types.ObjectId(userId);

    const chats = await ChatModel.find({ users: objectId })
      .sort({ updatedAt: -1 })
      .populate('users', 'username avatar')
      .populate('lastMessage', 'content senderId type files')
      .exec();

    return chats.map((chat) => ({
      _id: chat._id,
      users: chat.users.map((user) => ({
        _id:
          typeof user === 'object' && user !== null && '_id' in user
            ? (user as { _id: string })._id
            : user,
        username:
          typeof user === 'object' &&
          user !== null &&
          'username' in (user as any)
            ? (user as any).username
            : '',
        avatar:
          typeof user === 'object' &&
          user !== null &&
          'avatar' in (user as { avatar: string })
            ? (user as { avatar: string }).avatar
            : '',
      })),
      lastMessage: chat.lastMessage
        ? {
            _id:
              typeof chat.lastMessage === 'object' && '_id' in chat.lastMessage
                ? chat.lastMessage._id
                : chat.lastMessage,
            content:
              typeof chat.lastMessage === 'object' &&
              'content' in chat.lastMessage
                ? chat.lastMessage.content
                : '',
            sender:
              typeof chat.lastMessage === 'object' &&
              'senderId' in chat.lastMessage
                ? ((chat.lastMessage.senderId as any)?._id?.toString() ??
                  chat.lastMessage.senderId.toString())
                : '',
            type:
              typeof chat.lastMessage === 'object' && 'type' in chat.lastMessage
                ? chat.lastMessage.type
                : 'text',
            files:
              typeof chat.lastMessage === 'object' &&
              'files' in chat.lastMessage
                ? chat.lastMessage.files
                : [],
          }
        : null,
      isGroupChat: chat.isGroupChat,
      createdAt: chat.createdAt,
    }));
  }

  async getChatById(chatId: string): Promise<INormalizedChat | null> {
    const objectId = new mongoose.Types.ObjectId(chatId);

    const chat = await ChatModel.findById(objectId)
      .populate('users', 'username avatar')
      .populate('lastMessage', 'content senderId type files')
      .exec();

    if (!chat) return null;

    return {
      _id: chat._id,
      users: chat.users.map((user) => ({
        _id:
          typeof user === 'object' && user !== null && '_id' in user
            ? (user as { _id: string })._id
            : user,
        username:
          typeof user === 'object' &&
          user !== null &&
          'username' in (user as any)
            ? (user as any).username
            : '',
        avatar:
          typeof user === 'object' &&
          user !== null &&
          'avatar' in (user as { avatar: string })
            ? (user as { avatar: string }).avatar
            : '',
      })),
      lastMessage: chat?.lastMessage
        ? {
            _id:
              typeof chat.lastMessage === 'object' && '_id' in chat.lastMessage
                ? chat.lastMessage._id
                : chat.lastMessage,
            content:
              typeof chat.lastMessage === 'object' &&
              'content' in chat.lastMessage
                ? chat.lastMessage.content
                : '',
            sender:
              typeof chat.lastMessage === 'object' &&
              'senderId' in chat.lastMessage
                ? ((chat.lastMessage.senderId as any)?._id?.toString() ??
                  chat.lastMessage.senderId.toString())
                : '',
            type:
              typeof chat.lastMessage === 'object' && 'type' in chat.lastMessage
                ? chat.lastMessage.type
                : 'text',
            files:
              typeof chat.lastMessage === 'object' &&
              'files' in chat.lastMessage
                ? chat.lastMessage.files
                : [],
          }
        : null,
      isGroupChat: chat.isGroupChat,
      createdAt: chat.createdAt,
    };
  }

  async deleteMessage(messageId: string): Promise<void> {
    const deletedMessage = await MessageModel.findByIdAndDelete(messageId);
    if (!deletedMessage) {
      throw new Error('Message not found or could not be deleted');
    }
  }

  async editMessage(
    messageId: string,
    newContent: string,
  ): Promise<INormalizedMessage> {
    try {
      const updatedMessage = await MessageModel.findByIdAndUpdate(
        messageId,
        { content: newContent, updatedAt: new Date() },
        { new: true },
      );
      if (!updatedMessage) {
        throw new Error('Message not found or could not be updated');
      } else {
        console.log(
          'Message updated successfully:',
          updatedMessage,
          '>>>>>>>>>>>>>>>>>>>>>>',
        );
        await updatedMessage.populate('senderId', 'username avatar');

        return {
          _id: updatedMessage._id,
          chatId: updatedMessage.chatId,
          sender: {
            _id: updatedMessage.senderId,
            username: (updatedMessage.senderId as any).username,
            avatar: (updatedMessage.senderId as any).avatar,
          },
          content: updatedMessage.content,
          replyTo: updatedMessage.replyTo
            ? {
                _id:
                  typeof updatedMessage.replyTo === 'object'
                    ? updatedMessage.replyTo._id
                    : updatedMessage.replyTo,
                content:
                  typeof updatedMessage.replyTo === 'object'
                    ? updatedMessage.replyTo.content || ''
                    : '',
                sender:
                  typeof updatedMessage.replyTo === 'object' &&
                  'senderId' in updatedMessage.replyTo
                    ? updatedMessage.replyTo.senderId.toString()
                    : '',
              }
            : null,
          type: updatedMessage.type || 'text',
          createdAt: updatedMessage.createdAt,
        };
      }
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }
}

export default new ChatRepository();
