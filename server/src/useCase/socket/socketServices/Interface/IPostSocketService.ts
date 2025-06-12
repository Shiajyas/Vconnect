import { Socket } from 'socket.io';

export interface IPostSocketService {
  postUploaded(socket: Socket, userId: string, postId: string): Promise<void>;
  likePost(
    socket: Socket,
    userId: string,
    postId: string,
    type: string,
  ): Promise<void>;
  savePost(socket: Socket, postId: any, userId: string): Promise<void>;
  deletePost(socket: Socket, postId: any, userId: string): Promise<void>;
}
