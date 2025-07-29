import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { type Repository, LessThanOrEqual, In } from "typeorm"
import { type PaymentRetryQueue, PaymentStatus } from "../entities/payment-retry-queue.entity"
import type { CreatePaymentRetryDto } from "../dto/create-payment-retry.dto"
import type { UpdatePaymentRetryDto } from "../dto/update-payment-retry.dto"
import type { BlockchainService } from "../interfaces/blockchain-service.interface"
import type { NotificationService } from "./notification.service"

@Injectable()
export class PaymentRetryService {
  private readonly logger = new Logger(PaymentRetryService.name)

  constructor(
    private readonly paymentRetryRepository: Repository<PaymentRetryQueue>,
    private readonly blockchainService: BlockchainService,
    private readonly notificationService: NotificationService,
  ) {}

  async createPaymentRetry(createDto: CreatePaymentRetryDto): Promise<PaymentRetryQueue> {
    try {
      // Check if payment with same idempotency key already exists
      const existingPayment = await this.paymentRetryRepository.findOne({
        where: { idempotencyKey: createDto.idempotencyKey },
      })

      if (existingPayment) {
        this.logger.warn(`Payment with idempotency key ${createDto.idempotencyKey} already exists`)
        return existingPayment
      }

      const paymentRetry = this.paymentRetryRepository.create({
        ...createDto,
        nextRetryAt: new Date(Date.now() + 10 * 60 * 1000), // First retry in 10 minutes
      })

      const savedPayment = await this.paymentRetryRepository.save(paymentRetry)
      this.logger.log(`Created payment retry record: ${savedPayment.id}`)

      return savedPayment
    } catch (error) {
      this.logger.error(`Failed to create payment retry: ${error.message}`, error.stack)
      throw error
    }
  }

  async processPaymentRetries(): Promise<void> {
    this.logger.log("Starting payment retry processing...")

    const pendingPayments = await this.paymentRetryRepository.find({
      where: {
        status: In([PaymentStatus.PENDING, PaymentStatus.FAILED]),
        nextRetryAt: LessThanOrEqual(new Date()),
      },
      order: { createdAt: "ASC" },
      take: 50, // Process in batches
    })

    this.logger.log(`Found ${pendingPayments.length} payments to retry`)

    for (const payment of pendingPayments) {
      await this.processIndividualPayment(payment)
    }

    this.logger.log("Completed payment retry processing")
  }

  private async processIndividualPayment(payment: PaymentRetryQueue): Promise<void> {
    try {
      this.logger.log(`Processing payment retry: ${payment.id} (attempt ${payment.retryCount + 1})`)

      // Update status to processing
      await this.updatePaymentStatus(payment.id, { status: PaymentStatus.PROCESSING })

      // Attempt blockchain transaction
      const result = await this.blockchainService.sendTransaction(
        payment.recipientAddress,
        payment.paymentAmount,
        payment.currencySymbol,
        payment.contractAddress,
        payment.paymentMetadata,
      )

      if (result.success) {
        // Transaction successful
        await this.handleSuccessfulPayment(payment, result.transactionHash)
      } else {
        // Transaction failed
        await this.handleFailedPayment(payment, result.error, result.errorDetails)
      }
    } catch (error) {
      this.logger.error(`Error processing payment ${payment.id}: ${error.message}`, error.stack)
      await this.handleFailedPayment(payment, error.message, { stack: error.stack })
    }
  }

  private async handleSuccessfulPayment(payment: PaymentRetryQueue, transactionHash: string): Promise<void> {
    await this.paymentRetryRepository.update(payment.id, {
      status: PaymentStatus.COMPLETED,
      transactionHash,
      completedAt: new Date(),
      lastErrorMessage: null,
      errorDetails: null,
    })

    this.logger.log(`Payment ${payment.id} completed successfully with hash: ${transactionHash}`)
  }

  private async handleFailedPayment(
    payment: PaymentRetryQueue,
    errorMessage: string,
    errorDetails?: any,
  ): Promise<void> {
    const newRetryCount = payment.retryCount + 1
    const hasReachedMaxRetries = newRetryCount >= payment.maxRetryAttempts

    if (hasReachedMaxRetries) {
      // Mark as exhausted and send notification
      await this.paymentRetryRepository.update(payment.id, {
        status: PaymentStatus.EXHAUSTED,
        retryCount: newRetryCount,
        lastErrorMessage: errorMessage,
        errorDetails,
        exhaustedAt: new Date(),
        nextRetryAt: null,
      })

      this.logger.warn(`Payment ${payment.id} exhausted all retry attempts`)

      // Send failure notification
      await this.sendFailureNotification(payment, errorMessage)
    } else {
      // Schedule next retry
      const nextRetryAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

      await this.paymentRetryRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        retryCount: newRetryCount,
        lastErrorMessage: errorMessage,
        errorDetails,
        nextRetryAt,
      })

      this.logger.log(`Payment ${payment.id} scheduled for retry ${newRetryCount + 1} at ${nextRetryAt}`)
    }
  }

  private async sendFailureNotification(payment: PaymentRetryQueue, errorMessage: string): Promise<void> {
    try {
      if (!payment.notificationSent) {
        await this.notificationService.sendPaymentFailureNotification(
          payment.userEmail,
          payment.userId,
          payment.paymentAmount,
          payment.currencySymbol,
          errorMessage,
          payment.idempotencyKey,
        )

        await this.paymentRetryRepository.update(payment.id, {
          notificationSent: true,
        })

        this.logger.log(`Failure notification sent for payment ${payment.id}`)
      }
    } catch (error) {
      this.logger.error(`Failed to send notification for payment ${payment.id}: ${error.message}`)
    }
  }

  async updatePaymentStatus(id: string, updateDto: UpdatePaymentRetryDto): Promise<PaymentRetryQueue> {
    const payment = await this.paymentRetryRepository.findOne({ where: { id } })

    if (!payment) {
      throw new NotFoundException(`Payment retry with ID ${id} not found`)
    }

    await this.paymentRetryRepository.update(id, updateDto)
    return this.paymentRetryRepository.findOne({ where: { id } })
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentRetryQueue | null> {
    return this.paymentRetryRepository.findOne({ where: { idempotencyKey } })
  }

  async getPaymentsByUserId(userId: string): Promise<PaymentRetryQueue[]> {
    return this.paymentRetryRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    })
  }

  async getPaymentStats(): Promise<{
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    exhausted: number
  }> {
    const [total, pending, processing, completed, failed, exhausted] = await Promise.all([
      this.paymentRetryRepository.count(),
      this.paymentRetryRepository.count({ where: { status: PaymentStatus.PENDING } }),
      this.paymentRetryRepository.count({ where: { status: PaymentStatus.PROCESSING } }),
      this.paymentRetryRepository.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.paymentRetryRepository.count({ where: { status: PaymentStatus.FAILED } }),
      this.paymentRetryRepository.count({ where: { status: PaymentStatus.EXHAUSTED } }),
    ])

    return { total, pending, processing, completed, failed, exhausted }
  }
}
