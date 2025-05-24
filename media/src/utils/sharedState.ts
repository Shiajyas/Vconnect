// mediasoupRedisHelpers.ts
import { redisClient } from "../config/redis.config";

export async function saveTransportMetadata(transportId: string, routerId: string, roomId: string) {
  await redisClient.hset(`transport:${transportId}`, {
    routerId,
    roomId,
    createdAt: Date.now().toString(),
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
    createdAt: Date.now().toString(),
  });
}

export async function getTransportMetadata(transportId: string) {
  const data = await redisClient.hgetall(`transport:${transportId}`);
  return Object.keys(data).length === 0 ? undefined : data;
}

export async function getProducerMetadata(producerId: string) {
  const data = await redisClient.hgetall(`producer:${producerId}`);
  return Object.keys(data).length === 0 ? undefined : data;
}

export async function deleteTransportMetadata(transportId: string) {
  await redisClient.del(`transport:${transportId}`);
}

export async function deleteProducerMetadata(producerId: string) {
  await redisClient.del(`producer:${producerId}`);
}