import { Server as IOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

export let redisClient: Redis;

export const setupRedisAdapter = (io: IOServer) => {
  // Setup pub/sub clients for Socket.IO Redis adapter
  const pubClient = new Redis({
    port: 11126,
    host: 'redis-11126.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
    username: 'default',
    password: 'nBZMVa5vphoc2xGL5wbqr42fnp57ZsNw',
  });

  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  // Event handlers for pub/sub clients
  pubClient.on("error", (err) => console.error("🔴 Redis PubClient Error:", err));
  subClient.on("error", (err) => console.error("🔴 Redis SubClient Error:", err));
  pubClient.on("connect", () => console.log("✅ Redis PubClient connected"));
  subClient.on("connect", () => console.log("✅ Redis SubClient connected"));

  // Setup main redis client for other uses (shared connection)
  redisClient = new Redis({
    port: 11126,
    host: 'redis-11126.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
    username: 'default',
    password: 'nBZMVa5vphoc2xGL5wbqr42fnp57ZsNw',
  });

  redisClient.on("error", (err) => console.error("🔴 Redis Client Error:", err));
  redisClient.on("connect", () => console.log("✅ Redis Client connected"));

  redisClient.connect().catch((e) => console.error("Redis Client connect error:", e));
};