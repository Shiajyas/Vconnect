import { Socket } from 'socket.io';
import { IUserSocketService } from './Interface/IUserSocketService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { NotificationService } from '../../notificationService';
import { AdminSocketService } from './adminSocketService';
import { ObjectId } from 'mongodb';
import { Server } from 'socket.io';

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
    adminSocketService: AdminSocketService,
  ) {
    this.io = ioInstance;
    this.userRepository = userRepo;
    this.sessionUserRepository = sessionUserRepo;
    this.notificationService = notificationService;
    this.adminSocketService = adminSocketService;
  }

  private async broadcastOnlineUserCountToAdmins() {
    const count = await this.sessionUserRepository.getActiveUserCount();
    this.io.to('admin').emit('admin:updateOnlineCount', count);
  }

  async addUser(socket: Socket, userId: string): Promise<void> {
    try {
      console.log(`🔹 Adding user ${userId} with socket ID ${socket.id}`);

      await this.sessionUserRepository.addUser({ id: userId, socketId: socket.id });

      socket.emit('addUserSuccess', { userId });

      const onlineUsers = (await this.sessionUserRepository.getActiveUsers()).map((user) => user.id);
      this.io.emit('updateOnlineUsers', onlineUsers);

      await this.broadcastOnlineUserCountToAdmins();
    } catch (error) {
      this.handleError(socket, error, 'addUserError');
    }
  }

  async removeUser(socket: Socket, userId: string): Promise<void> {
    try {
      await this.sessionUserRepository.removeUser(socket.id);

      const onlineUsers = (await this.sessionUserRepository.getActiveUsers()).map((user) => user.id);
      this.io.emit('updateOnlineUsers', onlineUsers);

      await this.broadcastOnlineUserCountToAdmins();
    } catch (error) {
      this.handleError(socket, error, 'removeUserError');
    }
  }

  async getOnlineUsers(socket: Socket): Promise<void> {
    try {
      const onlineUsers = (await this.sessionUserRepository.getActiveUsers()).map((user) => user.id);
      socket.emit('updateOnlineUsers', onlineUsers);
    } catch (error) {
      this.handleError(socket, error, 'getOnlineUsersError');
    }
  }

  async joinUser(socket: Socket, id: string): Promise<void> {
    try {
      await this.sessionUserRepository.addUser({ id, socketId: socket.id });
      socket.emit('joinSuccess', { userId: id });
    } catch (error) {
      this.handleError(socket, error, 'joinError');
    }
  }

  async handleFollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    if (!userId || !followingId || userId === followingId) {
      throw new Error('Invalid follow request.');
    }

    const sender = await this.userRepository.findById(userId);
    const targetUser = await this.userRepository.findById(followingId);
    if (!sender || !targetUser) throw new Error('User not found.');

    if (sender.following?.includes(new ObjectId(followingId))) {
      throw new Error('Already following this user.');
    }

    await this.userRepository.update(
      { _id: userId },
      { $addToSet: { following: followingId } },
    );
    await this.userRepository.update(
      { _id: followingId },
      { $addToSet: { followers: userId } },
    );

    await this.notificationService.sendNotification(
      userId,
      [followingId],
      'follow',
      `${sender.username} started following you.`,
      undefined,
      sender.username,
    );

    this.io.emit('followSuccess', { followingId });
  }

  async handleUnfollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    try {
      const success = await this.userRepository.unfollow(userId, followingId);

      if (!success) {
        socket.emit('unfollowError', { message: 'Unfollow operation failed.' });
        return;
      }

      this.io.emit('unfollowSuccess', { followingId });
    } catch (error) {
      this.handleError(socket, error, 'unfollowError');
    }
  }

  async followUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void> {
    try {
      const { userId, followingId } = data;

      const sender = await this.userRepository.findById(userId);
      const targetUser = await this.userRepository.findById(followingId);
      if (!sender || !targetUser) throw new Error('User not found.');

      await this.userRepository.update(
        { _id: userId },
        { $addToSet: { following: followingId } },
      );
      await this.userRepository.update(
        { _id: followingId },
        { $addToSet: { followers: userId } },
      );

      await this.notificationService.sendNotification(
        userId,
        [followingId],
        'follow',
        `${sender.username} started following you.`,
        undefined,
        sender.username,
      );

      socket.emit('followSuccess', { followingId });
    } catch (error) {
      this.handleError(socket, error, 'followError');
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error);
    socket.emit(event, {
      message: error instanceof Error ? error.message : 'Unknown error occurred.',
    });
  }
}
