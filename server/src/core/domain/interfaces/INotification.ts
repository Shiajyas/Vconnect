import mongoose, {  Document } from 'mongoose';

export interface INotification extends Document {
  senderId: mongoose.Types.ObjectId; // The user who sent the notification
  receiverId: mongoose.Types.ObjectId; // The user receiving the notification
  message: string;
  type: "follow" | "unfollow" | "like" | "comment" | "mention"; // Define specific notification types
  isRead: boolean;
  createdAt: Date;
}