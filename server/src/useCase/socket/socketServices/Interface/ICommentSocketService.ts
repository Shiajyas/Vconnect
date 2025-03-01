import { Socket } from "socket.io";

export interface ICommentSocketService {
  addComment(
    socket: Socket,
    data: { userId: string; postId: string; content: string; parentId?: string }
  ): Promise<void>;

  deleteComment(socket: Socket, userId: string, commentId: string): Promise<void>;

  likeComment(socket: Socket, userId: string, commentId: string): Promise<void>;
}
