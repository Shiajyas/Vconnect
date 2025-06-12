import { Socket } from 'socket.io';
import { IUserSocketService } from '../../../useCase/socket/socketServices/Interface/IUserSocketService';

export const userHandlers = (
  socket: Socket,
  userSocketHandlers: IUserSocketService,
) => {
  socket.on('joinUser', (id) => userSocketHandlers.addUser(socket, id));

  socket.on('followUser', (data) => {
    userSocketHandlers.handleFollow(socket, data.userId, data.followingId);
  });

  socket.on('unfollowUser', (data) => {
    userSocketHandlers.handleUnfollow(socket, data.userId, data.followingId);
  });

  socket.on('userOnline', (userId) => {
    console.log(`User ${userId} is online`);
    socket.emit('updateOnlineUsers', userId);
  });

  socket.on('logOut', (userId) => {
    console.log(`🔌 Logging out user ${userId} with socket ${socket.id}`);
    userSocketHandlers.removeUser(socket, userId);
  });

  socket.on('getOnlineUsers', () => {
    console.log(`🔌 Getting online users for user with socket ${socket.id}`);
    userSocketHandlers.getOnlineUsers(socket);
  });

  socket.on("updateChatSocketId", (data) => {
    console.log(`90++ Updating chat socket ID for user with socket ${socket.id}`);
    userSocketHandlers.updateChatSocketId(data.userId, socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected with socket ${socket.id}`);
    userSocketHandlers.removeUser(socket, '');
  });
};
