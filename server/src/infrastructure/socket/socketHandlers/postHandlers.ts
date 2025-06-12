import { Socket } from 'socket.io';
import { IPostSocketService } from '../../../useCase/socket/socketServices/Interface/IPostSocketService';

export const postHandlers = (
  socket: Socket,
  postSocketHandlers: IPostSocketService,
) => {
  socket.on('joinPostRoom', (postId) => {
    socket.join(postId);
    console.log(`[${socket.id}] joined post room: ${postId}`);
  });

  socket.on('postUploaded', async (data) => {
    await postSocketHandlers.postUploaded(socket, data.userId, data.postId);
  });

  socket.on('like_post', async (data) => {
    await postSocketHandlers.likePost(
      socket,
      data.userId,
      data.postId,
      data.type,
    );
  });

  socket.on('savePost', async (postId, userId) => {
    console.log(postId, userId, '>>>>>>>>>>>>');
    try {
      await postSocketHandlers.savePost(socket, postId.postId, postId.userId);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  });

  socket.on('deletePost', async (postId,userId ) => {
    console.log(postId, userId, '>>>>>>>>>>>>');
    try {
      await postSocketHandlers.deletePost(socket, postId.postId, postId.userId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  });
};
