import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { RedisModule } from "./modules/redis/redis.module";
import { UserModule } from "./modules/user/user.module";
import { OrderModule } from "./modules/order/order.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { TailorModule } from "./modules/tailor/tailor.module";

import { AuthModule } from './auth/auth.module';
import { UserModule } from "./modules/user/user.module";

import { NotificationsModule } from "./modules/notifications/notifications.module";


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env.development",
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UserModule,
    OrderModule,
    InventoryModule,
    TailorModule,
    AuthModule,

    NotificationsModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
