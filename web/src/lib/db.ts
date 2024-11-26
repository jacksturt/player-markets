import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Create a Redis client pool
const redisPool = {
  max: 10, // Maximum number of connections in the pool
  clients: [] as (typeof redis)[],
  async acquire() {
    if (this.clients.length < this.max) {
      // Use the existing redis client from @/lib/db
      this.clients.push(redis);
    }
    return this.clients[Math.floor(Math.random() * this.clients.length)];
  },
  async release(client: typeof redis) {
    // In this implementation, we keep the client in the pool
    // No need to explicitly release as we're using the existing client
  },
};

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export { redis, redisPool };