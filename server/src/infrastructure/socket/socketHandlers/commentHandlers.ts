import { Socket } from 'socket.io';
import { ICommentSocketService } from '../../../useCase/socket/socketServices/Interface/ICommentSocketService';

export const commentHandlers = (
  socket: Socket,
  commendSocketHandlers: ICommentSocketService,
) => {
  socket.on('addComment', async (data) => {
    try {
      console.log(
        `💬 Comment added by ${data.userId} on Post ID: ${data.postId}`,
      );
      await commendSocketHandlers.addComment(socket, data);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  });

  socket.on('deleteComment', async (data) => {
    try {
      await commendSocketHandlers.deleteComment(socket, data?.commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  });

  socket.on('likeComment', async (data) => {
    try {
      const { userId, commentId } = data;
      await commendSocketHandlers.likeComment(socket, userId, commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  });

  socket.on('unLikeComment', async (data) => {
    try {
      const { userId, postId, commentId } = data;
      await commendSocketHandlers.unLikeComment(socket, userId, commentId);
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  });
};
