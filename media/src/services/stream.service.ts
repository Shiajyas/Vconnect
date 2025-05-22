import { redisClient } from "../config/redis.config";
import { StreamInfo } from "../types/socket.types";
import { transportService } from "./transportService";
import { mediaService } from "./media.service";
import type * as mediasoupTypes from "mediasoup/node/lib/types";

class StreamService {
  private readonly STREAMS_SET = 'streams:set';
  private readonly STREAM_HASH_PREFIX = 'stream:';

  async addStream(stream: StreamInfo) {
    const key = this.STREAM_HASH_PREFIX + stream.streamId;
    await redisClient.hset(key, {
      streamId: stream.streamId,
      hostSocketId: stream.hostSocketId,
      routerId: stream.routerId,
      producerId: stream.producerId,
    });
    await redisClient.sadd(this.STREAMS_SET, stream.streamId);
  }

  async getStream(streamId: string): Promise<StreamInfo | null> {
    const key = this.STREAM_HASH_PREFIX + streamId;
    const data = await redisClient.hgetall(key);
    if (Object.keys(data).length === 0) return null;
    return {
      streamId: data.streamId,
      hostSocketId: data.hostSocketId,
      routerId: data.routerId,
      producerId: data.producerId,
    };
  }

  async removeStream(streamId: string) {
    const key = this.STREAM_HASH_PREFIX + streamId;
    await redisClient.del(key);
    await redisClient.srem(this.STREAMS_SET, streamId);
  }

  async getAllStreams(): Promise<StreamInfo[]> {
    const streamIds = await redisClient.smembers(this.STREAMS_SET);
    const streams: StreamInfo[] = [];
    for (const id of streamIds) {
      const stream = await this.getStream(id);
      if (stream) streams.push(stream);
    }
    return streams;
  }

async connectTransport(
  transportId: string,
  dtlsParameters: mediasoupTypes.DtlsParameters
) {
  // Get transport metadata from Redis
  const transportMeta = await transportService.getTransport(transportId);
  if (!transportMeta) throw new Error('Transport metadata not found');

  // Await router Promise
  const router = await mediaService.getOrCreateRouter(transportMeta.routerId);
  if (!router) throw new Error('Router instance not found');

  // Get transport instance from router
// const router = await mediaService.getOrCreateRouter(transportMeta.routerId);
const transport = router.transports.get(transportId);

  // Connect transport with DTLS parameters
  await transport.connect({ dtlsParameters });
}



async updateProducerId(streamId: string, producerId: string) {
  const key = this.STREAM_HASH_PREFIX + streamId;
  await redisClient.hset(key, { producerId });
}


}

export const streamService = new StreamService();
