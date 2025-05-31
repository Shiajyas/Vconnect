import { Server as IOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

export let redisClient: Redis;

export const setupRedisAdapter = (io: IOServer) => {
  const pubClient = new Redis({
    host: 'localhost',
    port: 6379,
  });

  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  pubClient.on("error", (err) => console.error("🔴 Redis PubClient Error:", err));
  subClient.on("error", (err) => console.error("🔴 Redis SubClient Error:", err));
  pubClient.on("connect", () => console.log("✅ Redis PubClient connected"));
  subClient.on("connect", () => console.log("✅ Redis SubClient connected"));

  redisClient = new Redis({
    host: 'localhost',
    port: 6379,
  });

  redisClient.on("error", (err) => console.error("🔴 Redis Client Error:", err));
  redisClient.on("connect", () => console.log("✅ Redis Client connected"));


};
