import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const Redis = require("ioredis");
        return new Redis({
          host: configService.get("REDIS_HOST"),
          port: configService.get("REDIS_PORT"),
          password: configService.get("REDIS_PASSWORD"),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
