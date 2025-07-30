import { Controller, Post, Get, Patch, Param } from "@nestjs/common"
import type { PaymentRetryService } from "../services/payment-retry.service"
import type { CreatePaymentRetryDto } from "../dto/create-payment-retry.dto"
import type { UpdatePaymentRetryDto } from "../dto/update-payment-retry.dto"
import type { PaymentRetryQueue } from "../entities/payment-retry-queue.entity"

@Controller("payment-retry")
export class PaymentRetryController {
  constructor(private readonly paymentRetryService: PaymentRetryService) {}

  @Post()
  async createPaymentRetry(createDto: CreatePaymentRetryDto): Promise<PaymentRetryQueue> {
    return this.paymentRetryService.createPaymentRetry(createDto)
  }

  @Get('idempotency/:key')
  async getByIdempotencyKey(@Param('key') idempotencyKey: string): Promise<PaymentRetryQueue | null> {
    return this.paymentRetryService.getPaymentByIdempotencyKey(idempotencyKey);
  }

  @Get('user/:userId')
  async getPaymentsByUser(@Param('userId') userId: string): Promise<PaymentRetryQueue[]> {
    return this.paymentRetryService.getPaymentsByUserId(userId);
  }

  @Get("stats")
  async getPaymentStats() {
    return this.paymentRetryService.getPaymentStats()
  }

  @Patch(":id")
  async updatePayment(@Param('id') id: string, updateDto: UpdatePaymentRetryDto): Promise<PaymentRetryQueue> {
    return this.paymentRetryService.updatePaymentStatus(id, updateDto)
  }

  @Post("process-retries")
  async triggerRetryProcessing(): Promise<{ message: string }> {
    await this.paymentRetryService.processPaymentRetries()
    return { message: "Payment retry processing triggered successfully" }
  }
}
