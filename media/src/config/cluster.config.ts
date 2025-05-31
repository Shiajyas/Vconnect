import { redisClient } from './redis.config';
import os from 'os';

export interface NodeInfo {
  nodeId: string;
  host: string;
  port: number;
  pid: number;
  cpuCount: number;
  startTime: number;
  lastHeartbeat: number;
}

export interface WorkerMetadata {
  workerId: string;
  nodeId: string;
  host: string;
  port: number;
  pid: number;
  index: number;
  load: {
    routers: number;
    producers: number;
    consumers: number;
    transports: number;
  };
  status: 'active' | 'inactive' | 'dead';
  lastHeartbeat: number;
}

class ClusterManager {
  private nodeId: string;
  private nodeInfo: NodeInfo;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.nodeId = this.generateNodeId();
    this.nodeInfo = {
      nodeId: this.nodeId,
      host: process.env.HOST || 'localhost',
      port: parseInt(process.env.PORT || '3000'),
      pid: process.pid,
      cpuCount: os.cpus().length,
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
    };
  }

  private generateNodeId(): string {
    const hostname = os.hostname();
    const pid = process.pid;
    const timestamp = Date.now();
    return `${hostname}-${pid}-${timestamp}`;
  }

  async registerNode(): Promise<void> {
    await redisClient.hset(`node:${this.nodeId}`, {
      nodeId: this.nodeId,
      host: this.nodeInfo.host,
      port: this.nodeInfo.port.toString(),
      pid: this.nodeInfo.pid.toString(),
      cpuCount: this.nodeInfo.cpuCount.toString(),
      startTime: this.nodeInfo.startTime.toString(),
      lastHeartbeat: this.nodeInfo.lastHeartbeat.toString(),
      status: 'active',
    });

    await redisClient.sadd('cluster:nodes', this.nodeId);
    console.log(`✅ Node ${this.nodeId} registered in cluster`);
  }

  async registerWorker(workerId: string, workerIndex: number): Promise<void> {
    const workerMetadata: WorkerMetadata = {
      workerId,
      nodeId: this.nodeId,
      host: this.nodeInfo.host,
      port: this.nodeInfo.port,
      pid: this.nodeInfo.pid,
      index: workerIndex,
      load: {
        routers: 0,
        producers: 0,
        consumers: 0,
        transports: 0,
      },
      status: 'active',
      lastHeartbeat: Date.now(),
    };

    await redisClient.hset(`worker:${workerId}`, {
      workerId,
      nodeId: this.nodeId,
      host: this.nodeInfo.host,
      port: this.nodeInfo.port.toString(),
      pid: this.nodeInfo.pid.toString(),
      index: workerIndex.toString(),
      'load.routers': '0',
      'load.producers': '0',
      'load.consumers': '0',
      'load.transports': '0',
      status: 'active',
      lastHeartbeat: Date.now().toString(),
    });

    await redisClient.sadd('cluster:workers', workerId);
    await redisClient.sadd(`node:${this.nodeId}:workers`, workerId);
    
    console.log(`✅ Worker ${workerId} registered on node ${this.nodeId}`);
  }

  async updateWorkerLoad(workerId: string, metric: keyof WorkerMetadata['load'], delta: number): Promise<void> {
    await redisClient.hincrby(`worker:${workerId}`, `load.${metric}`, delta);
    await redisClient.hset(`worker:${workerId}`, 'lastHeartbeat', Date.now().toString());
  }

  async getWorkerMetadata(workerId: string): Promise<WorkerMetadata | null> {
    const data = await redisClient.hgetall(`worker:${workerId}`);
    if (Object.keys(data).length === 0) return null;

    return {
      workerId: data.workerId,
      nodeId: data.nodeId,
      host: data.host,
      port: parseInt(data.port),
      pid: parseInt(data.pid),
      index: parseInt(data.index),
      load: {
        routers: parseInt(data['load.routers'] || '0'),
        producers: parseInt(data['load.producers'] || '0'),
        consumers: parseInt(data['load.consumers'] || '0'),
        transports: parseInt(data['load.transports'] || '0'),
      },
      status: data.status as 'active' | 'inactive' | 'dead',
      lastHeartbeat: parseInt(data.lastHeartbeat),
    };
  }

  async getAllWorkers(): Promise<WorkerMetadata[]> {
    const workerIds = await redisClient.smembers('cluster:workers');
    const workers: WorkerMetadata[] = [];

    for (const workerId of workerIds) {
      const worker = await this.getWorkerMetadata(workerId);
      if (worker) workers.push(worker);
    }

    return workers;
  }

  async getLeastLoadedWorker(): Promise<WorkerMetadata | null> {
    const workers = await this.getAllWorkers();
    const activeWorkers = workers.filter(w => w.status === 'active');

    if (activeWorkers.length === 0) return null;

    // Calculate load score: routers + producers * 2 + consumers + transports * 0.5
    let minScore = Infinity;
    let selectedWorker: WorkerMetadata | null = null;

    for (const worker of activeWorkers) {
      const score = worker.load.routers + 
                   worker.load.producers * 2 + 
                   worker.load.consumers + 
                   worker.load.transports * 0.5;

      if (score < minScore) {
        minScore = score;
        selectedWorker = worker;
      }
    }

    return selectedWorker;
  }

  async startHeartbeat(): Promise<void> {
    this.heartbeatInterval = setInterval(async () => {
      try {
        this.nodeInfo.lastHeartbeat = Date.now();
        await redisClient.hset(`node:${this.nodeId}`, 'lastHeartbeat', this.nodeInfo.lastHeartbeat.toString());
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // 30 seconds

    console.log(`💓 Heartbeat started for node ${this.nodeId}`);
  }

  async stopHeartbeat(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async unregisterNode(): Promise<void> {
    await redisClient.srem('cluster:nodes', this.nodeId);
    await redisClient.del(`node:${this.nodeId}`);
    
    // Remove all workers for this node
    const workerIds = await redisClient.smembers(`node:${this.nodeId}:workers`);
    for (const workerId of workerIds) {
      await redisClient.srem('cluster:workers', workerId);
      await redisClient.del(`worker:${workerId}`);
    }
    await redisClient.del(`node:${this.nodeId}:workers`);

    console.log(`🔴 Node ${this.nodeId} unregistered from cluster`);
  }

  async cleanupDeadNodes(): Promise<void> {
    const nodeIds = await redisClient.smembers('cluster:nodes');
    const now = Date.now();
    const timeout = 120000; // 2 minutes

    for (const nodeId of nodeIds) {
      const nodeData = await redisClient.hgetall(`node:${nodeId}`);
      if (Object.keys(nodeData).length === 0) continue;

      const lastHeartbeat = parseInt(nodeData.lastHeartbeat || '0');
      if (now - lastHeartbeat > timeout) {
        console.warn(`🔴 Cleaning up dead node: ${nodeId}`);
        
        // Mark all workers as dead
        const workerIds = await redisClient.smembers(`node:${nodeId}:workers`);
        for (const workerId of workerIds) {
          await redisClient.hset(`worker:${workerId}`, 'status', 'dead');
        }

        // Remove node
        await redisClient.srem('cluster:nodes', nodeId);
        await redisClient.del(`node:${nodeId}`);
        await redisClient.del(`node:${nodeId}:workers`);
      }
    }
  }

  getNodeId(): string {
    return this.nodeId;
  }

  getNodeInfo(): NodeInfo {
    return { ...this.nodeInfo };
  }
}

export const clusterManager = new ClusterManager();
