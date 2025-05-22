import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';
import { mediaService } from '../services/media.service';
import { streamService } from '../services/stream.service';
import { onlineUserService } from '../services/online-user.service';
import { UserRepository } from '../models/user.repository';

const userRepository = new UserRepository();

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  console.log('Socket connected:', socket.id);

  let hostUserId: string | null = null;

  const emitViewerCount = (streamId: string) => {
    const size = io.sockets.adapter.rooms.get(streamId)?.size || 0;
    io.to(streamId).emit('live:viewers', size);
  };

  socket.on('live:start', async ({ streamId, userId }) => {
    try {
      console.log('live:start', streamId);
      hostUserId = userId;
      socket.data.streamId = streamId;

      const router = await mediaService.getOrCreateRouter(streamId);

      await streamService.addStream({
        streamId,
        hostSocketId: socket.id,
        routerId: router.id,
        producerId: '', // initially empty
      });

      socket.join(streamId);

      const friends = await userRepository.findFriends(userId);
      for (const friend of friends) {
        const onlineSocketIds = await onlineUserService.getOnlineSocketIds(friend._id.toString());
        onlineSocketIds.forEach((sid) => {
          io.to(sid).emit('live:notify', {
            hostId: userId,
            streamId,
          });
        });
      }

      emitViewerCount(streamId);
    } catch (error) {
      console.error('Error in live:start:', error);
    }
  });

  socket.on('live:join', ({ streamId }) => {
    try {
      console.log('live:join', streamId);
      socket.data.streamId = streamId;
      socket.join(streamId);
      emitViewerCount(streamId);
    } catch (error) {
      console.error('Error in live:join:', error);
    }
  });

  socket.on('live:leave', ({ streamId }) => {
    try {
      console.log('live:leave', streamId);
      socket.leave(streamId);
      emitViewerCount(streamId);
    } catch (error) {
      console.error('Error in live:leave:', error);
    }
  });

  socket.on('live:comment', ({ streamId, message }) => {
    try {
      io.to(streamId).emit('live:comment', message);
    } catch (error) {
      console.error('Error in live:comment:', error);
    }
  });

  socket.on('get-rtp-capabilities', async (callback) => {
    try {
      const streamId = socket.data.streamId;
      if (!streamId) return callback({ routerRtpCapabilities: { codecs: [] } });

      const router = await mediaService.getOrCreateRouter(streamId);
      callback({ routerRtpCapabilities: router.rtpCapabilities });
    } catch (error) {
      console.error('Error in get-rtp-capabilities:', error);
      callback({ routerRtpCapabilities: { codecs: [] } });
    }
  });

  socket.on('create-transport', async (callback) => {
    try {
      const streamId = socket.data.streamId;
      if (!streamId) throw new Error('Missing streamId in socket data');

      const router = await mediaService.getOrCreateRouter(streamId);
      const transport = await mediaService.createTransport(router, streamId);

      callback({
        transportOptions: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });
    } catch (error) {
      console.error('Error in create-transport:', error);
      callback({
        transportOptions: {
          id: '',
          iceParameters: { usernameFragment: '', password: '' },
          iceCandidates: [],
          dtlsParameters: { fingerprints: [] },
        },
      });
    }
  });

  socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      await streamService.connectTransport(transportId, dtlsParameters);
      callback();
    } catch (error) {
      console.error('Error in connect-transport:', error);
    }
  });

  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const producer = await mediaService.createProducer(transportId, kind as any, rtpParameters);

      const streamId = socket.data.streamId;
      if (streamId) {
        await streamService.updateProducerId(streamId, producer.id);
      }

      callback({ id: producer.id });
    } catch (error) {
      console.error('Error in produce:', error);
      callback({ id: '' });
    }
  });

  socket.on('consume', async ({ streamId, transportId }, callback) => {
    try {
      const stream = await streamService.getStream(streamId);
      if (!stream) throw new Error('Stream not found');

      const router = await mediaService.getOrCreateRouter(streamId);
      const consumer = await mediaService.createConsumer(
        router,
        transportId,
        stream.producerId,
        router.rtpCapabilities
      );

      callback({
        id: consumer.id,
        producerId: stream.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (error) {
      console.error('Error in consume:', error);
      callback({
        id: '',
        producerId: '',
        kind: '',
        rtpParameters: { codecs: [] } as any,
      });
    }
  });
}
