import mongoose, { Document } from "mongoose";

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId | any;
  title: string;
  description: string;
  mediaUrls: string[];
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  reports: {
    userId: mongoose.Types.ObjectId;
    reason: string;
  }[];
  commendCount: number;
  saved: mongoose.Types.ObjectId[];
  visibility: "public" | "private";
  visible: boolean; 
}
