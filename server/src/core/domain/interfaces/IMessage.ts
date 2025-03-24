

import mongoose, {  Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId:string; 
  content: string;
  type: "text" | "image" | "video" | "file"; 
  createdAt: Date;
  replyTo?: IMessage | string | null; 
}