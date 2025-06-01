import { Socket } from "socket.io";
import { IUserSocketService } from "./Interface/IUserSocketService";
import { ISUserRepository } from "../../../data/interfaces/ISUserRepository";
import { IUserRepository } from "../../../data/interfaces/IUserRepository";
import { NotificationService } from "../../notificationService";
import { AdminSocketService } from "./adminSocketService";
import { ObjectId } from "mongodb";
import { Server } from "socket.io";

export class UserSocketService implements IUserSocketService {
  private io: Server;
  private userRepository: IUserRepository;
  private sessionUserRepository: ISUserRepository;
  private notificationService: NotificationService;
  private adminSocketService: AdminSocketService;

  constructor(
    ioInstance: Server,
    userRepo: IUserRepository,
    sessionUserRepo: ISUserRepository,
    notificationService: NotificationService,
    adminSocketService: AdminSocketService
  ) {
    this.io = ioInstance;
    this.userRepository = userRepo;
    this.sessionUserRepository = sessionUserRepo;
    this.notificationService = notificationService;
    this.adminSocketService = adminSocketService;
  }

  private broadcastOnlineUserCountToAdmins() {
    const count = this.getOnlineUserCount();
    this.io.to("admin").emit("admin:updateOnlineCount", count);
  }

  getOnlineUserCount(): number {
    return this.sessionUserRepository.getActiveUsers().length;
  }

  addUser(socket: Socket, userId: string): void {
    try {
      console.log(`🔹 Adding user ${userId} with socket ID ${socket.id}`);

      this.sessionUserRepository.addUser({ id: userId, socketId: socket.id });

      socket.emit("addUserSuccess", { userId });

      const onlineUsers = this.sessionUserRepository.getActiveUsers().map((user) => user.id);
      console.log("Online users: ", onlineUsers);

      this.io.emit("updateOnlineUsers", onlineUsers);

      // 🔁 Notify all admins with updated count
      this.broadcastOnlineUserCountToAdmins();
    } catch (error) {
      this.handleError(socket, error, "addUserError");
    }
  }

  async removeUser(socket: Socket, userId: string): Promise<void> {
    try {
      console.log(`🔹 Removing user ${userId} (Socket ID: ${socket.id})`);

      this.sessionUserRepository.removeUser(socket.id);

      const onlineUsers = this.sessionUserRepository.getActiveUsers().map((user) => user.id);
      console.log("Online users: ", onlineUsers);

      this.io.emit("updateOnlineUsers", onlineUsers);

      // 🔁 Notify all admins with updated count
      this.broadcastOnlineUserCountToAdmins();
    } catch (error) {
      this.handleError(socket, error, "removeUserError");
    }
  }

  getOnlineUsers(socket: Socket): void {
    try {
      const onlineUsers = this.sessionUserRepository.getActiveUsers().map((user) => user.id);
      console.log("Online users: ", onlineUsers);
      socket.emit("updateOnlineUsers", onlineUsers);
    } catch (error) {
      this.handleError(socket, error, "getOnlineUsersError");
    }
  }

  joinUser(socket: Socket, id: string): void {
    try {
      console.log(`🔹 User ${id} joining with socket ID ${socket.id}`);
      this.sessionUserRepository.addUser({ id: id, socketId: socket.id });
      socket.emit("joinSuccess", { userId: id });
    } catch (error) {
      this.handleError(socket, error, "joinError");
    }
  }

  async handleFollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    if (!userId || !followingId || userId === followingId) {
      throw new Error("Invalid follow request.");
    }

    const sender = await this.userRepository.findById(userId);
    const targetUser = await this.userRepository.findById(followingId);
    if (!sender || !targetUser) throw new Error("User not found.");

    if (sender.following?.includes(new ObjectId(followingId))) {
      throw new Error("Already following this user.");
    }

    await this.userRepository.update({ _id: userId }, { $addToSet: { following: followingId } });
    await this.userRepository.update({ _id: followingId }, { $addToSet: { followers: userId } });

    await this.notificationService.sendNotification(
      userId,
      [followingId],
      "follow",
      `${sender.username} started following you.`,
      undefined,
      sender.username
    );

    this.io.emit("followSuccess", { followingId });
  }

  async handleUnfollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    try {
      const success = await this.userRepository.unfollow(userId, followingId);

      if (!success) {
        socket.emit("unfollowError", { message: "Unfollow operation failed." });
        return;
      }

      console.log(`✅ User ${userId} successfully unfollowed ${followingId}`);
      this.io.emit("unfollowSuccess", { followingId });
    } catch (error) {
      this.handleError(socket, error, "unfollowError");
    }
  }

  async followUser(socket: Socket, data: { userId: string; followingId: string }) {
    try {
      const { userId, followingId } = data;
      if (!userId || !followingId) throw new Error("Invalid request. User IDs are required.");

      const sender = await this.userRepository.findById(userId);
      const targetUser = await this.userRepository.findById(followingId);
      if (!sender || !targetUser) throw new Error("User not found.");

      await this.userRepository.update({ _id: userId }, { $addToSet: { following: followingId } });
      await this.userRepository.update({ _id: followingId }, { $addToSet: { followers: userId } });

      await this.notificationService.sendNotification(
        userId,
        [followingId],
        "follow",
        `${sender.username} started following you.`,
        undefined,
        sender.username
      );

      socket.emit("followSuccess", { followingId });
    } catch (error) {
      this.handleError(socket, error, "followError");
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error instanceof Error ? error.message : error);
    socket.emit(event, { message: error instanceof Error ? error.message : "An unknown error occurred." });
  }
}
