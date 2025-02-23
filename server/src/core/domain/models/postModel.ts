import mongoose, { Schema } from 'mongoose';
import { IPost } from '../interfaces/IPost';

const postSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    mediaUrls: { type: [String], default: [] },
    likes: [{ type: mongoose.Types.ObjectId, ref: "User", default: [] }],
    reports: [
      {
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
        reason: { type: String, required: true },
      },
    ],
  },
  { timestamps: true } 
);

const Post = mongoose.model<IPost>('post', postSchema);

export default Post;
