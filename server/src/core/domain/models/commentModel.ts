import mongoose, { Schema, Document } from "mongoose";
import { IComment } from "../interfaces/Icomment";

const CommentSchema = new Schema<IComment>(
    {
        postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }], 
        parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
        replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }], 
        mentions: [{ type: String }],
      },
      { timestamps: true }
  );
  
  export const CommentModel = mongoose.model<IComment>("Comment", CommentSchema);