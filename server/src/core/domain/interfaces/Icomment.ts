import mongoose, { Document } from "mongoose";

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[]; // Array of users who liked the comment
  parentCommentId?: mongoose.Types.ObjectId;
  mentions?: string[];
  replies: mongoose.Types.ObjectId[]; // Array to store nested replies
  createdAt: Date;
  }