// mediaSocketHandlers.ts

import { Server, Socket } from 'socket.io';
import {
  createWorker,
  createRouter,
  getRouterById,
  createWebRtcTransport,
  connectTransport,
  produce,
  consume,
  addStream,
  getStream,
  removeStream,
  streams
} from './mediasoupServer';
import { StreamInfo, ClientToServerEvents, ServerToClientEvents } from './types';
import * as mediasoupTypes from 'mediasoup/node/lib/types';

export async function registerMediaHandlers(io: Server, socket: Socket<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
  let worker = await createWorker();
  let router = await createRouter(worker);

  socket.on('live:start', async ({ streamId }) => {
    addStream({
      streamId,
      hostSocketId: socket.id,
      routerId: router.id,
      producerId: '',
    });
    socket.join(streamId);
    io.to(streamId).emit('live:viewers', io.sockets.adapter.rooms.get(streamId)?.size || 0);
  });

  socket.on('live:join', ({ streamId }) => {
    socket.join(streamId);
    io.to(streamId).emit('live:viewers', io.sockets.adapter.rooms.get(streamId)?.size || 0);
  });

  socket.on('live:leave', ({ streamId }) => {
    socket.leave(streamId);
    io.to(streamId).emit('live:viewers', io.sockets.adapter.rooms.get(streamId)?.size || 0);
  });

  socket.on('live:comment', ({ streamId, message }) => {
    io.to(streamId).emit('live:comment', message);
  });

  socket.on('get-rtp-capabilities', (callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on('create-transport', async (callback) => {
    const transport = await createWebRtcTransport(router);
    callback({
      transportOptions: {
        id: transport.id,
        iceParameters: transport.appData.iceParameters,
        iceCandidates: transport.appData.iceCandidates as any[],
        dtlsParameters: transport.appData.dtlsParameters,
      },
    });
  });

  socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
    await connectTransport(transportId, dtlsParameters);
    callback();
  });
  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    const producer = await produce(transportId, kind as mediasoupTypes.MediaKind, rtpParameters);
    // Update stream info with producerId
    for (const [streamId, stream] of streams.entries()) {
      if (stream.hostSocketId === socket.id) {
        stream.producerId = producer.id;
        addStream(stream);
        break;
      }
    }
    callback({ id: producer.id });
  });


  socket.on('consume', async ({ streamId, transportId }, callback) => {
    const stream = getStream(streamId);
    if (!stream) {
      callback({ id: '', producerId: '', kind: '', rtpParameters: { codecs: [] } });
      return;
    }
    const router = getRouterById(stream.routerId);
    if (!router) {
   callback({ id: '', producerId: '', kind: '', rtpParameters: { codecs: [] } });
      return;
    }
    const consumer = await consume(router, transportId, stream.producerId, router.rtpCapabilities);
    callback({
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });
});

}
