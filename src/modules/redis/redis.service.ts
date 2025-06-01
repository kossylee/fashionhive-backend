import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async setRefreshToken(
    userId: number,
    token: string,
    ttl: number
  ): Promise<void> {
    await this.set(`refresh_token:${userId}`, token, ttl);
  }

  async getRefreshToken(userId: number): Promise<string | null> {
    return this.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: number): Promise<void> {
    await this.del(`refresh_token:${userId}`);
  }

  async blacklistToken(jti: string, ttl: number): Promise<void> {
    await this.set(`blacklist:${jti}`, "true", ttl);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(`blacklist:${jti}`);
  }
}
