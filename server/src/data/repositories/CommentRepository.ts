
import { ICommentRepository } from "../interfaces/ICommentRepository";
import { CommentModel} from "../../core/domain/models/commentModel";
import mongoose from "mongoose";
import { log } from "console";

export class CommentRepository implements ICommentRepository {
  async addComment(commentData: {
    userId: string;
    postId: string;
    content: string;
    parentId?: string;
  }): Promise<any> {
    try {
      const newComment = new CommentModel({
        userId: new mongoose.Types.ObjectId(commentData.userId),
        postId: new mongoose.Types.ObjectId(commentData.postId),
        content: commentData.content,
        parentId: commentData.parentId ? new mongoose.Types.ObjectId(commentData.parentId) : null,
        likes: [],
        createdAt: new Date(),
      });

      return await newComment.save();
    } catch (error) {
      throw new Error(`Error adding comment: ${error}`);
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const deleted = await CommentModel.findByIdAndDelete(new mongoose.Types.ObjectId(commentId));
      return !!deleted;
    } catch (error) {
      throw new Error(`Error deleting comment: ${error}`);
    }
  }

  async likeComment(commentId: string, userId: string): Promise<{ commentId: string; likes: number }> {
    try {
      const comment = await CommentModel.findById(commentId);
      if (!comment) throw new Error("Comment not found");

      const alreadyLiked = comment.likes.includes(new mongoose.Types.ObjectId(userId));
      if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => !id.equals(new mongoose.Types.ObjectId(userId)));
      } else {
        comment.likes.push(new mongoose.Types.ObjectId(userId));
      }

      await comment.save();
      return { commentId, likes: comment.likes.length };
    } catch (error) {
      throw new Error(`Error liking comment: ${error}`);
    }
  }

  async findCommentById(commentId: string): Promise<any> {
    try {
      return await CommentModel.findById(new mongoose.Types.ObjectId(commentId));
    } catch (error) {
      throw new Error(`Error finding comment: ${error}`);
    }
  }

  async getCommentsForPost(postId: string, limit: number, offset: number) {
    try {
     
      const objectIdPostId = new mongoose.Types.ObjectId(postId);

      // console.log("objectIdPostId>>>>>>>>>>>", objectIdPostId, typeof objectIdPostId);

     const comments = await CommentModel.find({ postId: objectIdPostId, parentCommentId: null })
     .populate("userId", "fullname avatar username")
     .sort({ createdAt: -1 })
 
    // console.log("comments>>>>>>>>>>>", comments); 

     return comments
      
    } catch (error) {
      console.error("Error fetching comments:", error);
      if (error instanceof Error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      } else {
        throw new Error("Error fetching comments");
      }
    }
}


  async getRepliesForComment(commentId: string): Promise<any[]> {
    try {
      return await CommentModel.find({ parentId: new mongoose.Types.ObjectId(commentId) }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching replies: ${error}`);
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(commentId),
        { content, updatedAt: new Date() },
        { new: true }
      );
      return !!updated;
    } catch (error) {
      throw new Error(`Error updating comment: ${error}`);
    }
  }
}

