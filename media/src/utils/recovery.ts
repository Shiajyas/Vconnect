import * as mediasoup from 'mediasoup';
import { redisClient } from '../config/redis.config';
import { registerWorker } from './loadbalancer';
import { workers, roomRouterMap, routerWorkerMap } from '../config/mediasoup.config';

export async function handleWorkerDeath(deadWorkerId: string) {
  console.warn(`⚠️ Worker ${deadWorkerId} died`);

  // Clean up all routers belonging to the dead worker
  for (const [roomId, router] of roomRouterMap.entries()) {
    const routerOwnerWorkerId = routerWorkerMap.get(router.id);
    if (routerOwnerWorkerId === deadWorkerId) {
      console.warn(`🧹 Cleaning up room "${roomId}" (routerId: ${router.id})`);

      // Remove from in-memory maps
      roomRouterMap.delete(roomId);
      routerWorkerMap.delete(router.id);

      // Remove from Redis
      await redisClient.del(`room:${roomId}`);
    }
  }

  // Remove dead worker's Redis state
  await redisClient.del(`worker:${deadWorkerId}:load`);

  // Create and register a replacement worker
  const newWorker = await mediasoup.createWorker();
  const newWorkerId = await registerWorker(newWorker, workers.length);
  workers.push(newWorker);

  newWorker.on('died', () => {
    // Chain death handler
    handleWorkerDeath(newWorkerId);
  });

  console.log(`✅ Replacement worker "${newWorkerId}" started`);
}
