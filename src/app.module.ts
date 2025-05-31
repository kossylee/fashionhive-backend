import { Module } from "@nestjs/common";
import { UserModule } from "./modules/user/user.module";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { OrderModule } from "./modules/order/order.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { TailorModule } from "./modules/tailor/tailor.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env.development",
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    AnalyticsModule,
    OrderModule,
    InventoryModule,
    TailorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
