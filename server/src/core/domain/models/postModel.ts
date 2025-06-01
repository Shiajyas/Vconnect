  import mongoose, { Schema } from "mongoose";
  import { IPost } from "../interfaces/IPost";

  export const postSchema = new Schema<IPost>(
    {
      userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
      saved: [{ type: mongoose.Types.ObjectId, ref: "user" }],
      title: { type: String, required: true },
      description: { type: String, required: true },
      mediaUrls: { type: [String], default: [] },
      likes: [{ type: mongoose.Types.ObjectId, ref: "user", default: [] }],
      reports: [
        {
          userId: { type: mongoose.Types.ObjectId, ref: "user" },
          reason: { type: String, required: true },
        },
      ],
      commendCount: { type: Number, default: 0 },

      // Added visibility field for public/private posts
      visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },
    { timestamps: true }
  );

  const Post = mongoose.model<IPost>("post", postSchema);

  export default Post;
