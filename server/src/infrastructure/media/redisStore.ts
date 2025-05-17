import { Server as IOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import createClient from "ioredis";

export const setupRedisAdapter = (io: IOServer) => {
  const pubClient = new createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  });
 
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  pubClient.on("error", (err) => console.error("🔴 Redis PubClient Error:", err));
  subClient.on("error", (err) => console.error("🔴 Redis SubClient Error:", err));

  pubClient.on("connect", () => console.log("✅ Redis PubClient connected"));
  subClient.on("connect", () => console.log("✅ Redis SubClient connected"));
};
