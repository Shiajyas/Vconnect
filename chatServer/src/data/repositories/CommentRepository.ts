import { ICommentRepository } from '../interfaces/ICommentRepository';
import { CommentModel } from '../../core/domain/models/commentModel';
import Post from '../../core/domain/models/postModel';
import mongoose from 'mongoose';

export class CommentRepository implements ICommentRepository {
  async addComment(commentData: {
    userId: string;
    postId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<any> {
    try {
      const { userId, postId, content, parentCommentId } = commentData;
      const newComment = new CommentModel({
        userId: new mongoose.Types.ObjectId(userId),
        postId: new mongoose.Types.ObjectId(postId),
        content,
        parentCommentId: parentCommentId
          ? new mongoose.Types.ObjectId(parentCommentId)
          : null,
        likes: [],
        createdAt: new Date(),
      });

      await newComment.save();

      // Increment postCount only for top-level comments
      if (!parentCommentId) {
        await Post.findByIdAndUpdate(postId, { $inc: { commendCount: 1 } });
      }

      return newComment;
    } catch (error) {
      throw new Error(`Error adding comment: ${error}`);
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new Error('Invalid comment ID');
      }

      // Find the comment
      const comment = await CommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const postId = comment.postId;
      if (!postId) {
        throw new Error('Post ID not found for this comment');
      }

      console.log('Post ID:', postId.toString()); // Debugging log

      let deletedCount = 1; // Start with deleting the main comment

      // If it's a parent comment, delete all replies
      if (!comment.parentCommentId) {
        const replies = await CommentModel.deleteMany({
          parentCommentId: commentId,
        });
        // Ensure count includes deleted replies
        console.log('Replies deleted:', replies.deletedCount);
      }

      // Delete the comment itself
      const deleted = await CommentModel.findByIdAndDelete(commentId);

      if (deleted) {
        console.log(`Decreasing commendCount by: ${deletedCount}`);

        // Fetch the post first to check the current comment count
        const post = await Post.findById(postId);
        if (post) {
          const newCommendCount = Math.max(
            0,
            (post.commendCount || 0) - deletedCount,
          ); // Ensure it never goes below 0

          const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { commendCount: newCommendCount },
            { new: true },
          );

          console.log('Updated Post after delete:', updatedPost); // Debugging log
        }
      } else {
        console.log('Comment was not deleted successfully.');
      }

      return !!deleted;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error(`Error deleting comment: ${error}`);
    }
  }

  async findCommentById(commentId: string): Promise<any> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new Error('Invalid comment ID');
      }
      const comment = await CommentModel.findById(commentId);
      if (!comment) throw new Error('Comment not found');
      return comment;
    } catch (error) {
      throw new Error(`Error finding comment: ${error}`);
    }
  }

  async getCommentsForPost(
    postId: string,
    page: number,
    limit: number,
  ): Promise<any[]> {
    try {
      const offset = (page - 1) * limit;
      return await CommentModel.find({ postId }) // Fetch only top-level comments
        .populate('userId', 'fullname avatar') // Fetch user details
        .populate({
          path: 'replies',
          populate: { path: 'userId', select: 'fullname avatar' },
        })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
    } catch (error) {
      throw new Error(`Error fetching comments: ${error}`);
    }
  }

  async getRepliesForComment(commentId: string): Promise<any[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new Error('Invalid comment ID');
      }

      return await CommentModel.find({ parentCommentId: commentId })
        .sort({ createdAt: 1 })
        .lean();
    } catch (error) {
      throw new Error(`Error fetching replies: ${error}`);
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new Error('Invalid comment ID');
      }

      const updated = await CommentModel.findByIdAndUpdate(
        commentId,
        { content, updatedAt: new Date() },
        { new: true },
      );

      return !!updated;
    } catch (error) {
      throw new Error(`Error updating comment: ${error}`);
    }
  }

  async addReply(
    parentCommentId: mongoose.Types.ObjectId,
    replyId: string,
  ): Promise<void> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(parentCommentId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
      ) {
        throw new Error('Invalid parent comment or reply ID');
      }

      await CommentModel.findByIdAndUpdate(parentCommentId, {
        $push: { replies: new mongoose.Types.ObjectId(replyId) },
      });
    } catch (error) {
      throw new Error(`Error adding reply: ${error}`);
    }
  }

  async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ commentId: string; likes: mongoose.Types.ObjectId[] }> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(commentId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error('Invalid comment or user ID');
      }

      const update = await CommentModel.findByIdAndUpdate(
        commentId,
        {
          $addToSet: { likes: userId }, // Add user to likes (if not already liked)
        },
        { new: true },
      );

      if (!update) throw new Error('Comment not found');

      return { commentId, likes: update.likes };
    } catch (error) {
      throw new Error(`Error liking comment: ${error}`);
    }
  }

  async unLikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ commentId: string; likes: mongoose.Types.ObjectId[] }> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(commentId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error('Invalid comment or user ID');
      }

      const update = await CommentModel.findByIdAndUpdate(
        commentId,
        {
          $pull: { likes: userId }, // Remove user from likes
        },
        { new: true },
      );

      if (!update) throw new Error('Comment not found');

      return { commentId, likes: update.likes };
    } catch (error) {
      throw new Error(`Error unliking comment: ${error}`);
    }
  }

  async getPostId(commentId: string): Promise<{ postId: string }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new Error('Invalid comment ID');
      }

      const comment = await CommentModel.findById(commentId).select('postId');
      if (!comment) {
        throw new Error('Comment not found');
      }

      return { postId: comment.postId.toString() };
    } catch (error) {
      throw new Error(`Error getting post ID: ${error}`);
    }
  }

  async getCommentDetails(commentId: string): Promise<any> {
    let res = await CommentModel.findById(commentId)
      .select('postId  parentCommentId')
      .lean();
    console.log(res, '>>>>>>>>123');
    return res;
  }
}
