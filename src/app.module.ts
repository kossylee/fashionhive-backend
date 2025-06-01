import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { OrderModule } from "./modules/order/order.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { TailorModule } from "./modules/tailor/tailor.module";
import { AuthModule } from './auth/auth.module';
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env.development",
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    OrderModule,
    InventoryModule,
    TailorModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
