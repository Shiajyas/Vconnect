export interface ICommentRepository {
    addComment(commentData: {
      userId: string;
      postId: string;
      content: string;
      parentId?: string; 
    }): Promise<any>;
  
    deleteComment(commentId: string): Promise<boolean>;
  
    likeComment(commentId: string, userId: string): Promise<{ commentId: string; likes: number }>;
  
    findCommentById(commentId: string): Promise<any>;
  
    getCommentsForPost(postId: string, limit: number, offset: number): Promise<any[]>;
  
    getRepliesForComment(commentId: string): Promise<any[]>;
  
    updateComment(commentId: string, content: string): Promise<boolean>;
  }
  