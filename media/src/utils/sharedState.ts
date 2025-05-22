
import { redisClient } from "../config/redis.config";

export async function saveTransportMetadata(transportId: string, routerId: string, roomId: string) {
  await redisClient.hset(`transport:${transportId}`, {
    routerId,
    roomId,
    createdAt: Date.now(),
  });
}

export async function getRouterIdByTransport(transportId: string): Promise<string | undefined> {
  const result = await redisClient.hget(`transport:${transportId}`, 'routerId');
  return result === null ? undefined : result;
}

export async function saveProducerMetadata(producerId: string, transportId: string, kind: string, routerId: string) {
  await redisClient.hset(`producer:${producerId}`, {
    transportId,
    kind,
    routerId,
    createdAt: Date.now(),
  });
}
