import { Injectable } from "@nestjs/common";
import { ThrottlerStorageService } from "@nestjs/throttler";
import Redis from "ioredis";

@Injectable()
export class RedisThrottlerService implements ThrottlerStorageService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async increment(
    key: string,
    ttl: number
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, ttl);

    const results = await multi.exec();
    const totalHits = results[0][1] as number;
    const timeToExpire = await this.redis.ttl(key);

    return { totalHits, timeToExpire };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}
