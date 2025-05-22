import * as mediasoup from 'mediasoup';
import type {
  Worker,
  Router,
  Transport,
  Producer,
  RtpCapabilities,
  DtlsParameters,
  RtpParameters,
  WebRtcTransport,
} from 'mediasoup/node/lib/types';

import { redisClient } from './redis.config';
import {
  getLeastLoadedWorker,
  incrementWorkerMetric,
  decrementWorkerMetric,
  registerWorker,
} from '../utils/loadbalancer';

export const workers: Worker[] = [];
export const roomRouterMap: Map<string, Router> = new Map();
export const routerWorkerMap: Map<string, string> = new Map(); // maps router.id -> workerId
const transports: Map<string, Transport> = new Map();
const producers: Map<string, Producer> = new Map();

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

export async function createWebRtcTransport(router: Router, roomId: string): Promise<WebRtcTransport> {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '127.0.0.1', announcedIp: undefined }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  transport.appData = { roomId };
  transports.set(transport.id, transport);

  return transport;
}

export async function connectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
  const transport = transports.get(transportId);
  if (!transport) throw new Error('Transport not found');
  await transport.connect({ dtlsParameters });
}

export async function produce(
  transportId: string,
  kind: mediasoup.types.MediaKind,
  rtpParameters: RtpParameters
): Promise<Producer> {
  const transport = transports.get(transportId);
  if (!transport) throw new Error('Transport not found');

  const routerId = findRouterIdByTransport(transportId);
  if (!routerId) throw new Error('Router not found for transport');

  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData: { routerId },
  });

  producers.set(producer.id, producer);

  const workerId = routerWorkerMap.get(routerId);
  if (workerId) {
    await incrementWorkerMetric(workerId, 'producers');
  }

  return producer;
}

export async function consume(
  consumerRouter: Router,
  transportId: string,
  producerId: string,
  rtpCapabilities: RtpCapabilities
) {
  const transport = transports.get(transportId);
  if (!transport) throw new Error('Transport not found');

  const producer = producers.get(producerId);
  if (!producer) throw new Error('Producer not found');

  if (!consumerRouter.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Router cannot consume this producer');
  }

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

function findRouterIdByTransport(transportId: string): string | undefined {
  const transport = transports.get(transportId);
  const roomId = transport?.appData?.roomId;
  if (typeof roomId !== 'string' || !roomId) return undefined;

  const router = roomRouterMap.get(roomId);
  return router?.id;
}
