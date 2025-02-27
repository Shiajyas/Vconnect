
import { ICommentRepository } from "../interfaces/ICommentRepository";
import { CommentModel} from "../../core/domain/models/commentModel";
import { ObjectId } from "mongodb";

export class CommentRepository implements ICommentRepository {
  async addComment(commentData: {
    userId: string;
    postId: string;
    content: string;
    parentId?: string;
  }): Promise<any> {
    try {
      const newComment = new CommentModel({
        userId: new ObjectId(commentData.userId),
        postId: new ObjectId(commentData.postId),
        content: commentData.content,
        parentId: commentData.parentId ? new ObjectId(commentData.parentId) : null,
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
      const deleted = await CommentModel.findByIdAndDelete(new ObjectId(commentId));
      return !!deleted;
    } catch (error) {
      throw new Error(`Error deleting comment: ${error}`);
    }
  }

  async likeComment(commentId: string, userId: string): Promise<{ commentId: string; likes: number }> {
    try {
      const comment = await CommentModel.findById(commentId);
      if (!comment) throw new Error("Comment not found");

      const alreadyLiked = comment.likes.includes(new ObjectId(userId));
      if (alreadyLiked) {
        comment.likes = comment.likes.filter((id: ObjectId) => !id.equals(new ObjectId(userId)));
      } else {
        comment.likes.push(new ObjectId(userId));
      }

      await comment.save();
      return { commentId, likes: comment.likes.length };
    } catch (error) {
      throw new Error(`Error liking comment: ${error}`);
    }
  }

  async findCommentById(commentId: string): Promise<any> {
    try {
      return await CommentModel.findById(new ObjectId(commentId));
    } catch (error) {
      throw new Error(`Error finding comment: ${error}`);
    }
  }

  async getCommentsForPost(postId: string, limit: number, offset: number): Promise<any[]> {
    try {
      return await CommentModel.find({ postId: new ObjectId(postId), parentId: null })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
    } catch (error) {
      throw new Error(`Error fetching comments: ${error}`);
    }
  }

  async getRepliesForComment(commentId: string): Promise<any[]> {
    try {
      return await CommentModel.find({ parentId: new ObjectId(commentId) }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching replies: ${error}`);
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const updated = await CommentModel.findByIdAndUpdate(
        new ObjectId(commentId),
        { content, updatedAt: new Date() },
        { new: true }
      );
      return !!updated;
    } catch (error) {
      throw new Error(`Error updating comment: ${error}`);
    }
  }
}

