import * as mediasoup from 'mediasoup';
import type {
  Worker,
  Router,
  Transport,
  Producer,
  RtpCapabilities,
  RtpParameters,
  WebRtcTransport,
} from 'mediasoup/node/lib/types';

import { redisClient } from './redis.config';
import {
  getLeastLoadedWorker,
  incrementWorkerMetric,
  registerWorker,
} from '../utils/loadbalancer';

import {
  saveTransportMetadata,
  saveProducerMetadata,
  getRouterIdByTransport,
} from '../utils/sharedState';

// Workers array
export const workers: Worker[] = [];

// Maps for managing mediasoup routers and workers
export const roomRouterMap: Map<string, Router> = new Map();
export const routerWorkerMap: Map<string, string> = new Map(); // router.id -> workerId

// Local caches for live mediasoup objects — these are NOT serialized to Redis
export const localTransportCache: Map<string, Transport> = new Map();
export const producers: Map<string, Producer> = new Map();

// Setup mediasoup workers
export const setupMediasoup = async () => {
  const numWorkers = require('os').cpus().length;

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker();
    const workerId = await registerWorker(worker, i);

    worker.on('died', () => {
      import('../utils/recovery').then(({ handleWorkerDeath }) => {
        handleWorkerDeath(workerId);
      });
    });

    workers.push(worker);
  }
};

// Create or get Router per roomId
export async function getOrCreateRouterForRoom(roomId: string): Promise<Router> {
  if (roomRouterMap.has(roomId)) {
    return roomRouterMap.get(roomId)!;
  }

  const { worker, workerId } = await getLeastLoadedWorker(workers);

  const mediaCodecs = [
    {
      kind: 'audio' as const,
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video' as const,
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: {},
    },
  ];

  const router = await worker.createRouter({ mediaCodecs });

  roomRouterMap.set(roomId, router);
  routerWorkerMap.set(router.id, workerId);
  await incrementWorkerMetric(workerId, 'routers');

  await redisClient.hset(`room:${roomId}`, 'routerId', router.id);

  return router;
}

// Create a WebRtcTransport for a router and room, caching locally and persisting minimal metadata in Redis
export async function createWebRtcTransport(router: Router, roomId: string): Promise<WebRtcTransport> {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '127.0.0.1', announcedIp: undefined }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  transport.appData = { roomId };

  localTransportCache.set(transport.id, transport);

  await saveTransportMetadata(transport.id, router.id, roomId);

  return transport;
}

// Helper to get Transport instance from local cache (not Redis)
export function getTransportInstance(transportId: string): Transport | undefined {
  return localTransportCache.get(transportId);
}

// Produce media on a given transport (using local cache for transport instance)
export async function produce(
  transportId: string,
  kind: mediasoup.types.MediaKind,
  rtpParameters: RtpParameters
): Promise<Producer> {
  const routerId = await getRouterIdByTransport(transportId);
  if (!routerId) throw new Error('Router not found for transport');

  const transport = getTransportInstance(transportId);
  if (!transport) throw new Error('Transport not found');

  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData: { routerId },
  });

  producers.set(producer.id, producer);

  await saveProducerMetadata(producer.id, transportId, kind, routerId);

  const workerId = routerWorkerMap.get(routerId);
  if (workerId) await incrementWorkerMetric(workerId, 'producers');

  return producer;
}

// Consume media from a producer on a consumer router
export async function consume(
  consumerRouter: Router,
  transportId: string,
  producerId: string,
  rtpCapabilities: RtpCapabilities
) {
  const transport = getTransportInstance(transportId);
  if (!transport) throw new Error('Transport not found');

  const producer = producers.get(producerId);
  if (!producer) throw new Error('Producer not found');

  if (!consumerRouter.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Router cannot consume this producer');
  }

  // Cross-router pipeToRouter for multi-router setup (if needed)
  const producerRouterId = producer.appData?.routerId;
  const producerRouter = Array.from(roomRouterMap.values()).find(r => r.id === producerRouterId);

  if (producerRouter && consumerRouter.id !== producerRouter.id) {
    await consumerRouter.pipeToRouter({
      producerId: producer.id,
      router: producerRouter,
    });
  }

  return await transport.consume({
    producerId,
    rtpCapabilities,
    paused: false,
  });
}

// Helper to find router id by transport id, using local cache for transport, Redis for router metadata
export async function findRouterIdByTransport(transportId: string): Promise<string | undefined> {
  const transport = getTransportInstance(transportId);
  if (!transport) return undefined;
  
  if (transport.appData?.roomId as string) {
    const router = roomRouterMap.get(transport.appData.roomId as string);
    return router?.id;
  }

  // fallback: try Redis or other persistent store lookup here (if necessary)
  // Example:
  // const routerId = await redisClient.hget(`transport:${transportId}`, 'routerId');
  // return routerId || undefined;

  return undefined;
}