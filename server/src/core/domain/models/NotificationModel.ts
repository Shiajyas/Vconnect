import mongoose, {  Schema} from 'mongoose';
import { INotification } from '../interfaces/INotification';


const NotificationSchema: Schema = new Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["follow", "unfollow", "like", "comment", "mention"], required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
  
  const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
  
  export { Notification };