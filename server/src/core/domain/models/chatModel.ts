import mongoose, { Schema } from "mongoose";
import { IChat } from "../interfaces/IChat";


const ChatSchema: Schema = new Schema(
  {
    name: { type: String, trim: true },
    isGroupChat: { type: Boolean, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // Last message reference
  },
  { timestamps: true }
);
  
  export default mongoose.model<IChat>("Chat", ChatSchema);