import { Socket } from "socket.io";

export interface ISocketHandlers {

  joinUser(socket: Socket, id: string): void;


  followUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void>;


  unfollowUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void>;


  likePost(socket: Socket, userId: string, postId: string, type: string): Promise<void>;

  addComment(socket: Socket, data: { userId: string; postId: string; content: string }): Promise<void>;

  deleteComment(socket: Socket, data: { userId: string; postId: string; commentId: string }): Promise<void>;

  likeComment(socket: Socket, data: { userId: string; postId: string; commentId: string }): Promise<void>;
}
