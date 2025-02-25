import { Socket } from "socket.io";

export interface ISocketHandlers {

  joinUser(socket: Socket, id: string): void;


  joinAdmin(socket: Socket, id: string): void;


  followUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void>;


  unfollowUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void>;


  logActiveUsers(): { userId: string; socketId: string }[];

  likePost(socket: Socket, userId: string, postId: string, type: string): Promise<void>;
}
