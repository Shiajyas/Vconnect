
import { ServerToClientEvents } from '../types/socket.types';
import { ClientToServerEvents } from '../types/socket.types';
import {CreateTransportResponse } from '../types/socket.types';
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents as SocketClientToServerEvents, ServerToClientEvents as SocketServerToClientEvents } from '../types/socket.types';
import { mediaService } from '../services/media.service';
import { streamService } from '../services/stream.service';
import { onlineUserService } from '../services/online-user.service';
import { UserRepository } from '../models/user.repository';
import { localTransportCache, producers } from '../config/mediasoup.config';
import { redisClient } from '../config/redis.config';
import { RtpCapabilities, RtpParameters } from 'mediasoup/node/lib/rtpParametersTypes';
import { getIceServers } from '../config/mediasoup.config';

const userRepository = new UserRepository();

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
  console.log('Socket connected:', socket.id);

  let hostUserId: string | null = null;

  // Track transports created by this socket for cleanup
  const socketTransportIds = new Set<string>();

  // Track producers created by this socket for cleanup
  const socketProducerIds = new Set<string>();

  // Emit viewer count helper
  const emitViewerCount = (streamId: string) => {
    const size = io.sockets.adapter.rooms.get(streamId)?.size || 0;
    io.to(streamId).emit('live:viewers', size);
  };

  // Cleanup user data on disconnect
  async function cleanupUserData() {
    try {
      // Close and remove all producers created by this socket
      for (const producerId of socketProducerIds) {
        const producer = producers.get(producerId);
        if (producer) {
          await producer.close();
          producers.delete(producerId);
          await redisClient.del(`producer:${producerId}`);
        }
      }

      // Close and remove all transports created by this socket
      for (const transportId of socketTransportIds) {
        localTransportCache.delete(transportId);
        await redisClient.del(`transport:${transportId}`);
      }

      // Remove user from online users if they were authenticated
      if (socket.data.userId) {
        await onlineUserService.removeUser(socket.data.userId, socket.id);
      }

      // Remove user session
      await redisClient.del(`user:${socket.id}`);

      // Remove user from any rooms they are in and update viewer counts
      const rooms = socket.rooms;
      for (const room of rooms) {
        if (room !== socket.id) {
          socket.leave(room);
          emitViewerCount(room);
        }
      }

      // console.log(`Cleaned up media and session data for socket ${socket.id}`);
    } catch (err) {
      console.error(`Error cleaning up user data for socket ${socket.id}:`, err);
    }
  }

  socket.on('disconnect', async () => {
    console.log(`Socket ${socket.id} disconnected`);
    await cleanupUserData();
  });
  
  socket.on('live:start', async ({ streamId, userId }) => {    
    try {      
      // console.log('live:start', { streamId, userId, socketId: socket.id });
      hostUserId = userId;
      socket.data.streamId = streamId;

      const router = await mediaService.getOrCreateRouter(streamId);

      await streamService.addStream({
        streamId,
        hostSocketId: socket.id,
        routerId: router.id,
        producerId: '',
      });

      socket.join(streamId);

      // Get user info for the stream
      const userData = await redisClient.hgetall(`user:${socket.id}`);
      
      const streamData = {
        userId,
        username: userData.username || socket.data.username || 'Unknown',
        avatar: userData.avatar || socket.data.avatar,
        streamId,
      };

      // Notify friends about the live stream
      try {
        const friends = await userRepository.findFriends(userId);
        for (const friend of friends) {
          const onlineSocketIds = await onlineUserService.getOnlineSocketIds(friend._id.toString());
          onlineSocketIds.forEach((sid) => {
            io.to(sid).emit('live:notify', {
              hostId: userId,
              streamId,
            });
            
            // Emit the event your client is listening for
            io.to(sid).emit('live:started', streamData);
          });
        }
      } catch (friendsError) {
        console.warn('Error notifying friends:', friendsError);
      }

      // Also broadcast to all connected users (not just friends)
      socket.broadcast.emit('live:started', streamData);

      emitViewerCount(streamId);
    } catch (error) {
      console.error('Error in live:start:', error);
    }
  });

  socket.on('live:end', async ({ streamId }) => {
    try {
      console.log('live:end', { streamId, socketId: socket.id });
      
      // Notify all viewers that stream ended
      io.to(streamId).emit('live:ended', { streamId });
      
      // Broadcast to all users
      socket.broadcast.emit('live:ended', { streamId });
      
      // Remove stream from service
      await streamService.removeStream(streamId);
      
      // Clear socket data
      socket.data.streamId = undefined;
      hostUserId = null;
      
      // Remove everyone from the stream room
      const socketsInRoom = await io.in(streamId).fetchSockets();
      for (const socketInRoom of socketsInRoom) {
        socketInRoom.leave(streamId);
      }
      
    } catch (error) {
      console.error('Error in live:end:', error);
    }
  });

  socket.on('live:join', ({ streamId }) => {
    try {
      console.log('live:join', { streamId, socketId: socket.id });
      socket.data.streamId = streamId;
      socket.join(streamId);
      emitViewerCount(streamId);
    } catch (error) {
      console.error('Error in live:join:', error);
    }
  });

  socket.on('live:leave', ({ streamId }) => {
    try {
      console.log('live:leave', { streamId, socketId: socket.id });
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

  socket.on('get-rtp-capabilities', async (data, callback) => {
    try {
      // Handle both old and new call patterns
      let streamId: string | undefined;
      let callbackFn: (data: { routerRtpCapabilities: RtpCapabilities }) => void;

      // Check if data is the callback (old pattern) or contains streamId (new pattern)
      if (typeof data === 'function') {
        callbackFn = data;
        streamId = socket?.data?.streamId;
      } else {
        streamId = data?.streamId || socket?.data?.streamId;
        callbackFn = callback;
      }

      // console.log('get-rtp-capabilities', { 
      //   socketData: socket?.data, 
      //   providedStreamId: typeof data === 'object' ? data?.streamId : undefined,
      //   targetStreamId: streamId 
      // });
      
      if (!streamId) {
        console.warn('No streamId available for get-rtp-capabilities');
        return callbackFn({ routerRtpCapabilities: { codecs: [] } as RtpCapabilities });
      }

      // Store streamId in socket data if not already set
      if (!socket.data.streamId) {
        socket.data.streamId = streamId;
      } 

      const router = await mediaService.getOrCreateRouter(streamId);
      
      callbackFn({ routerRtpCapabilities: router.rtpCapabilities });
    } catch (error) {
      console.error('Error in get-rtp-capabilities:', error);
      const callbackFn = typeof data === 'function' ? data : callback;
      callbackFn({ routerRtpCapabilities: { codecs: [] } as RtpCapabilities });
    }
  });

  socket.on('create-transport', async (data: { streamId?: string } | ((data: CreateTransportResponse) => void), callback?: (data: CreateTransportResponse) => void) => {
    try {
      // Handle both old and new call patterns
      let streamId: string | undefined;
      let callbackFn: (data: CreateTransportResponse) => void;

      // Check if data is the callback (old pattern) or contains streamId (new pattern)
      if (typeof data === 'function') {
        callbackFn = data;
        streamId = socket?.data?.streamId;
      } else {
        streamId = data?.streamId || socket?.data?.streamId;
        callbackFn = callback!;
      }

      // console.log('create-transport', { 
      //   socketData: socket?.data, 
      //   providedStreamId: typeof data === 'object' ? data?.streamId : undefined,
      //   targetStreamId: streamId 
      // });

      if (!streamId) {
        console.error('Missing streamId in socket data and not provided in request');
        return callbackFn({
          transportOptions: {
            id: '',
            iceParameters: { usernameFragment: '', password: '' },
            iceCandidates: [],
            dtlsParameters: { fingerprints: [] },
          },
          iceServers: []
        });
      }

      // Store streamId in socket data if not already set
      if (!socket.data.streamId) {
        socket.data.streamId = streamId;
      }

      const router = await mediaService.getOrCreateRouter(streamId);
      const transport = await mediaService.createTransport(router, streamId);

      // Track this transport for cleanup on disconnect
      socketTransportIds.add(transport.id);

      callbackFn({
        transportOptions: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
        iceServers: getIceServers()
      });
    } catch (error) {
      console.error('Error in create-transport:', error);
      const callbackFn = typeof data === 'function' ? data : callback!;
      callbackFn({
        transportOptions: {
          id: '',
          iceParameters: { usernameFragment: '', password: '' },
          iceCandidates: [],
          dtlsParameters: { fingerprints: [] },
        },
        iceServers: []
      });
    }
  });

socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback: (result: { success: boolean, error?: string }) => void) => {
  try {
      // console.log(`Connecting transport: ${transportId}`, dtlsParameters);
      await streamService.connectTransport(transportId, dtlsParameters);
      callback({ success: true });
    } catch (error) {
      console.error('Error in connect-transport:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
});
  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const producer = await mediaService.createProducer(transportId, kind as any, rtpParameters);

      // Track this producer for cleanup on disconnect
      socketProducerIds.add(producer.id);

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


socket.on('consume', async (
  {
    streamId,
    transportId,
    rtpCapabilities
  }: {
    streamId: string;
    transportId: string;
    rtpCapabilities: RtpCapabilities;
  },
  callback: (response: {
    id: string;
    producerId: string;
    kind: string;
    rtpParameters: RtpParameters;
  }) => void
) => {
  try {
    const stream = await streamService.getStream(streamId);
    if (!stream) throw new Error('Stream not found');
    if (!stream.producerId) throw new Error('No producer found for stream');

    const router = await mediaService.getOrCreateRouter(streamId);

    if (!rtpCapabilities) {
      throw new Error('No RTP capabilities provided');
    }

    const consumer = await mediaService.createConsumer(
      router,
      transportId,
      stream.producerId,
      rtpCapabilities
    );

    // console.log(`Created consumer: ${consumer.id} for producer: ${stream.producerId}`);

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
      kind: 'video',
      rtpParameters: {
        codecs: [],
        headerExtensions: [],
        encodings: [],
        rtcp: { cname: '', reducedSize: true },
      }
    });
  }
});


  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    // If this user was host, notify everyone that stream ended
    if (hostUserId && socket.data.streamId) {
      socket.broadcast.emit('live:ended', socket.data.streamId);
    }

    // Cleanup user data
    cleanupUserData();

    // If this user was host, remove the stream
    if (hostUserId) {
      try {
        streamService.removeStreamByHostSocket(socket.id);
      } catch (err) {
        console.error('Error removing stream on disconnect:', err);
      }
    }
  });
}
