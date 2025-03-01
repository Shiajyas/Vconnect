import mongoose, {  Schema} from 'mongoose';
import { INotification } from '../interfaces/INotification';
import User from './userModel';

const NotificationSchema: Schema = new Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiverId: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }],
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["follow", "unfollow", "like", "comment", "mention","post"], required: true },
    isRead: { type: Boolean, default: false },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);
  
  const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
  
  export { Notification };