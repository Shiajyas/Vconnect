

import { redisClient } from '../config/redis.config';

interface TransportInfo {
  transportId: string;
  roomId: string;
  routerId: string;
  workerId: string;
  // You can add more metadata like creation time, client socketId, etc.
}

class TransportService {
  private readonly TRANSPORTS_SET = 'transports:set';

  async addTransport(info: TransportInfo): Promise<void> {
    const key = `transport:${info.transportId}`;

    await redisClient.hset(key, {
      transportId: info.transportId,
      roomId: info.roomId,
      routerId: info.routerId,
      workerId: info.workerId,
    });

    await redisClient.sadd(this.TRANSPORTS_SET, info.transportId);
    await redisClient.sadd(`room:${info.roomId}:transports`, info.transportId);
    await redisClient.sadd(`router:${info.routerId}:transports`, info.transportId);
  }

  async getTransport(transportId: string): Promise<TransportInfo | null> {
    const key = `transport:${transportId}`;
    const data = await redisClient.hgetall(key);
    if (Object.keys(data).length === 0) return null;
  console.log("data from transport service",data)
    return {
      transportId: data.transportId,
      roomId: data.roomId,
      routerId: data.routerId,
      workerId: data.workerId,
    };
  }

  async removeTransport(transportId: string): Promise<void> {
    const key = `transport:${transportId}`;
    const transport = await this.getTransport(transportId);
    if (!transport) return;

    await redisClient.del(key);
    await redisClient.srem(this.TRANSPORTS_SET, transportId);
    await redisClient.srem(`room:${transport.roomId}:transports`, transportId);
    await redisClient.srem(`router:${transport.routerId}:transports`, transportId);
  }

  async getTransportsByRoom(roomId: string): Promise<TransportInfo[]> {
    const transportIds = await redisClient.smembers(`room:${roomId}:transports`);
    const transports: TransportInfo[] = [];

    for (const id of transportIds) {
      const transport = await this.getTransport(id);
      if (transport) transports.push(transport);
    }
    return transports;
  }

  async getTransportsByRouter(routerId: string): Promise<TransportInfo[]> {
    const transportIds = await redisClient.smembers(`router:${routerId}:transports`);
    const transports: TransportInfo[] = [];

    for (const id of transportIds) {
      const transport = await this.getTransport(id);
      if (transport) transports.push(transport);
    }
    return transports;
  }
}

export const transportService = new TransportService();
