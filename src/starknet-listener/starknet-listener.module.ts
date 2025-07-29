import { Module, type OnModuleInit } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Order } from "./entities/order.entity"
import { OrderService } from "./services/order.service"
import { StarkNetProviderService } from "./services/starknet-provider.service"
import { StarkNetEventListener } from "./services/starknet-event.listener"
import { STARKNET_PROVIDER } from "./interfaces/starknet-provider.interface"
import { OrderController } from "./controllers/order.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderController], // Include controller for API interaction
  providers: [
    OrderService,
    StarkNetEventListener,
    {
      provide: STARKNET_PROVIDER,
      useClass: StarkNetProviderService, // Use the simulated provider
    },
  ],
  exports: [OrderService, StarkNetEventListener], // Export if other modules need to interact
})
export class StarkNetListenerModule implements OnModuleInit {
  constructor(private readonly starkNetEventListener: StarkNetEventListener) {}

  onModuleInit() {
    // The listener starts automatically via OnModuleInit in StarkNetEventListener
    // No explicit call needed here, but this demonstrates the module's lifecycle.
  }
}
