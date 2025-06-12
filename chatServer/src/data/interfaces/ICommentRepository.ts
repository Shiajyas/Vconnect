import mongoose from 'mongoose';

export interface ICommentRepository {
  getCommentsForPost(
    postId: string,
    limit: number,
    offset: number,
  ): Promise<any[]>;

  getRepliesForComment(commentId: string): Promise<any[]>;

  updateComment(commentId: string, content: string): Promise<boolean>;

  addComment(commentData: {
    userId: string;
    postId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<any>;

  addReply(
    parentCommentId: mongoose.Types.ObjectId,
    replyId: string,
  ): Promise<void>;

  deleteComment(commentId: string): Promise<boolean>;

  likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ commentId: string; likes: mongoose.Types.ObjectId[] }>;

  unLikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ commentId: string; likes: mongoose.Types.ObjectId[] }>;

  findCommentById(commentId: string | undefined): Promise<any>;

  getPostId(commentId: string): Promise<{ postId: string }>;

  getCommentDetails(commentId: string): Promise<any>;
}
