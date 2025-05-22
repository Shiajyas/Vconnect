

import { redisClient } from "../config/redis.config";
import { Worker } from 'mediasoup/node/lib/types';

const WORKER_PREFIX = 'worker';

export async function registerWorker(worker: Worker, index: number): Promise<string> {
  const workerId = `${WORKER_PREFIX}-${index}`;
  await redisClient.hset(`worker:${workerId}:load`, 'routers', 0, 'producers', 0);
  return workerId;
}

export async function incrementWorkerMetric(workerId: string, key: 'routers' | 'producers') {
  await redisClient.hincrby(`worker:${workerId}:load`, key, 1);
}

export async function decrementWorkerMetric(workerId: string, key: 'routers' | 'producers') {
  await redisClient.hincrby(`worker:${workerId}:load`, key, -1);
}

export async function getLeastLoadedWorker(workers: Worker[]): Promise<{ worker: Worker, workerId: string }> {
  let minScore = Infinity;
  let selected: { worker: Worker, workerId: string } | null = null;

  for (let i = 0; i < workers.length; i++) {
    const workerId = `${WORKER_PREFIX}-${i}`;
    const load = await redisClient.hgetall(`worker:${workerId}:load`);
    const routers = parseInt(load.routers || '0');
    const producers = parseInt(load.producers || '0');
    const score = routers + producers * 2;

    if (score < minScore) {
      minScore = score;
      selected = { worker: workers[i], workerId };
    }
  }

  if (!selected) throw new Error('No available workers');
  return selected;
}
