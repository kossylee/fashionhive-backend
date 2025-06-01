import { Module } from "@nestjs/common";
import { UserModule } from "./modules/user/user.module";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { OrderModule } from "./modules/order/order.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { TailorModule } from "./modules/tailor/tailor.module";
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from './modules/notifications/notifications.module';


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
    UserModule,
    OrderModule,
    InventoryModule,
    TailorModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
