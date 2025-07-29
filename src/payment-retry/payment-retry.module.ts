import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"
import { PaymentRetryQueue } from "./entities/payment-retry-queue.entity"
import { PaymentRetryService } from "./services/payment-retry.service"
import { PaymentRetryController } from "./controllers/payment-retry.controller"
import { PaymentRetryTask } from "./tasks/payment-retry.task"
import { NotificationService } from "./services/notification.service"
import { StarkNetBlockchainService } from "./services/starknet-blockchain.service"
import { BlockchainService } from "./interfaces/blockchain-service.interface"

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRetryQueue]), ScheduleModule.forRoot()],
  controllers: [PaymentRetryController],
  providers: [
    PaymentRetryService,
    PaymentRetryTask,
    NotificationService,
    {
      provide: BlockchainService,
      useClass: StarkNetBlockchainService,
    },
  ],
  exports: [PaymentRetryService],
})
export class PaymentRetryModule {}
