

import mongoose, {  Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string | null; 
  content: string;
  type: "text" | "image" | "video" | "file"|"link"; 
  createdAt: Date;
  replyTo?: IMessage | string | null; 
  replayContent?: string | null;
  files?: { url: string; name?: string; type?: string }[];

}