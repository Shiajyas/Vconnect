import { Socket } from "socket.io";

export interface IUserSocketService {
  addUser(socket: Socket, userId: string): void;
  handleFollow(socket: Socket, userId: string, followingId: string): Promise<void>;
  handleUnfollow(socket: Socket, userId: string, followingId: string): Promise<void>;
}
