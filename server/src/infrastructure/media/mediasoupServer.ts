// mediasoupServer.ts

import { Worker, Router, Transport, Producer, RtpCapabilities, DtlsParameters, RtpParameters } from 'mediasoup/node/lib/types';
import mediasoup from 'mediasoup';
import { StreamInfo } from './types';

const workers: Worker[] = [];
const routers: Map<string, Router> = new Map();
const transports: Map<string, Transport> = new Map();
const producers: Map<string, Producer> = new Map();
export const streams: Map<string, StreamInfo> = new Map();

export async function createWorker(): Promise<Worker> {
  const worker = await mediasoup.createWorker();
  workers.push(worker);
  return worker;
}

export async function createRouter(worker: Worker): Promise<Router> {
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
  routers.set(router.id, router);
  return router;
}

export function getRouterById(routerId: string): Router | undefined {
  return routers.get(routerId);
}

export async function createWebRtcTransport(router: Router): Promise<Transport> {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '127.0.0.1', announcedIp: undefined }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });
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
  const producer = await transport.produce({ kind, rtpParameters });
  producers.set(producer.id, producer);
  return producer;
}

export async function consume(
  router: Router,
  transportId: string,
  producerId: string,
  rtpCapabilities: RtpCapabilities
) {
  const transport = transports.get(transportId);
  if (!transport) throw new Error('Transport not found');
  const producer = producers.get(producerId);
  if (!producer) throw new Error('Producer not found');

  if (!router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume');
  }

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused: false,
  });

  return consumer;
}

export function addStream(stream: StreamInfo): void {
  streams.set(stream.streamId, stream);
}

export function getStream(streamId: string): StreamInfo | undefined {
  return streams.get(streamId);
}

export function removeStream(streamId: string): void {
  streams.delete(streamId);
}
