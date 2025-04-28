
import mongoose, { Schema} from "mongoose";
import { IMessage } from "../interfaces/IMessage";

const MessageSchema: Schema = new Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "video", "file","link"], default: "text" },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null }, // Self-referencing for replies
    
  },
  { timestamps: true }
);
  
  export default mongoose.model<IMessage>("Message", MessageSchema);