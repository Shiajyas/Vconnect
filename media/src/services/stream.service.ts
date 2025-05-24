import { redisClient } from "../config/redis.config";
import { StreamInfo } from "../types/socket.types";
import { transportService } from "./transportService";
import { mediaService, } from "./media.service"; // Adjust imports
import type * as mediasoupTypes from "mediasoup/node/lib/types";
import { getRouterIdByTransport } from "../utils/sharedState"; // your Redis helper to get routerId by transportId

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
    // Get transport metadata from Redis (you might have a function in transportService for this)
    const transportMeta = await transportService.getTransport(transportId);
    if (!transportMeta) throw new Error('Transport metadata not found');

    // Get routerId associated with this transport
    // You can get routerId directly from transportMeta.routerId or use Redis helper for safety
    const routerId = transportMeta.routerId ?? await getRouterIdByTransport(transportId);
    if (!routerId) throw new Error('Router ID not found for transport');

    // Get Router instance from your local map
    const router = mediaService.roomRouterMap.get(routerId);
    if (!router) throw new Error(`Router instance not found for routerId ${routerId}`);

    // Get Transport instance from your local cache
    const transport = mediaService.localTransportCache.get(transportId);
    if (!transport) throw new Error(`Transport instance not found for transportId ${transportId}`);

    // Connect transport with DTLS parameters
    await transport.connect({ dtlsParameters });
  }

  async updateProducerId(streamId: string, producerId: string) {
    const key = this.STREAM_HASH_PREFIX + streamId;
    await redisClient.hset(key, { producerId });
  }

async removeStreamByHostSocket(hostSocketId: string): Promise<void> {
  const streamIds = await redisClient.smembers(this.STREAMS_SET);
  for (const streamId of streamIds) {
    const stream = await this.getStream(streamId);
    if (stream && stream.hostSocketId === hostSocketId) {

      // Remove from Redis
      await this.removeStream(streamId);
      console.log(`Stream ${streamId} removed for hostSocketId ${hostSocketId}`);

      // Cleanup mediasoup resources (example)
      const router = mediaService.roomRouterMap.get(stream.routerId);
      if (router) {
        // Close all transports linked to this router
        mediaService.localTransportCache.forEach((transport, id) => {
          if (transport.appData.streamId === streamId) {
            transport.close();
            mediaService.localTransportCache.delete(id);
          }
        });

        // Close the router itself if needed
        router.close();
        mediaService.roomRouterMap.delete(stream.routerId);
      }

      // Optionally, clear producer references if you store them locally
      // mediaService.localProducerCache.delete(stream.producerId);

      break; // assuming one stream per host
    } 
  }
}
 
async getAllActiveStreams(): Promise<StreamInfo[]> {
  const streamIds = await redisClient.smembers(this.STREAMS_SET);
  const activeStreams: StreamInfo[] = [];
  for (const id of streamIds) {
    const stream = await this.getStream(id);
    if (stream) activeStreams.push(stream);
  }
  return activeStreams;
} 

}
export const streamService = new StreamService()
