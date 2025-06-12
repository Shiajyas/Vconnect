import  {  Document,  } from 'mongoose';
import { IMessage } from './IMessage';

export interface IChat extends Document {
  _id: string;
  name?: string; // Optional (only for group chats)
  isGroupChat: boolean;
  users: string[]; // Array of user IDs
  lastMessage?: IMessage | string; // Store last message ID or message object
  createdAt: Date;
  updatedAt: Date;
}
