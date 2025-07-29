import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { PaymentRetryService } from "../services/payment-retry.service"

@Injectable()
export class PaymentRetryTask {
  private readonly logger = new Logger(PaymentRetryTask.name)

  constructor(private readonly paymentRetryService: PaymentRetryService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handlePaymentRetries(): Promise<void> {
    this.logger.log("Starting scheduled payment retry task...")

    try {
      await this.paymentRetryService.processPaymentRetries()
      this.logger.log("Payment retry task completed successfully")
    } catch (error) {
      this.logger.error(`Payment retry task failed: ${error.message}`, error.stack)
    }
  }

  // Additional cron job for cleanup (runs daily at 2 AM)
  @Cron("0 2 * * *")
  async handleCleanup(): Promise<void> {
    this.logger.log("Starting payment retry cleanup task...")

    try {
      // Clean up old completed/exhausted records (older than 30 days)
      // This is optional and depends on your data retention policy
      this.logger.log("Cleanup task completed")
    } catch (error) {
      this.logger.error(`Cleanup task failed: ${error.message}`, error.stack)
    }
  }
}
