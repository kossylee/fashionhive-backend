import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import type { OrderService } from "./order.service"
import {
  STARKNET_PROVIDER,
  type PaymentConfirmedEvent,
  type StarkNetProvider,
} from "../interfaces/starknet-provider.interface"
import { OrderStatus } from "../entities/order.entity"

@Injectable()
export class StarkNetEventListener implements OnModuleInit {
  private readonly logger = new Logger(StarkNetEventListener.name)
  private readonly starkNetProvider: StarkNetProvider

  constructor(private readonly orderService: OrderService) {
    this.starkNetProvider = STARKNET_PROVIDER
  }

  onModuleInit() {
    this.logger.log("StarkNetEventListener initialized. Starting to listen for events...")
    this.starkNetProvider.listenForPaymentConfirmedEvents(this.handlePaymentConfirmedEvent.bind(this))
  }

  private async handlePaymentConfirmedEvent(event: PaymentConfirmedEvent): Promise<void> {
    this.logger.log(`Received PaymentConfirmedEvent: ${JSON.stringify(event)}`)

    try {
      const { orderId, transactionHash, amount, currency } = event

      // 1. Find the corresponding backend order
      const order = await this.orderService.findOrderByOrderId(orderId)

      if (!order) {
        this.logger.warn(`Order with ID ${orderId} not found in backend. Skipping update.`)
        // Potentially log this to a dead-letter queue or alert system
        return
      }

      // 2. Check if the order is already paid or has this transaction hash
      if (order.status === OrderStatus.PAID && order.transactionHash === transactionHash) {
        this.logger.warn(
          `Order ${orderId} already processed with transaction hash ${transactionHash}. Skipping duplicate update.`,
        )
        return
      }

      // 3. Validate payment details (optional but recommended)
      // You might want to compare event.amount and event.currency with order.paymentAmount and order.currencySymbol
      if (order.paymentAmount !== amount || order.currencySymbol !== currency) {
        this.logger.error(
          `Payment mismatch for order ${orderId}: Expected ${order.paymentAmount} ${order.currencySymbol}, got ${amount} ${currency}.`,
        )
        // Handle this discrepancy, e.g., mark order as suspicious, notify admin
        return
      }

      // 4. Update the order status
      await this.orderService.updateOrderStatus(orderId, {
        status: OrderStatus.PAID,
        transactionHash: transactionHash,
        paymentMetadata: {
          ...order.paymentMetadata,
          blockchainEvent: event, // Store the raw event for auditing
        },
      })

      this.logger.log(`Successfully updated order ${orderId} to PAID with transaction hash ${transactionHash}`)
    } catch (error) {
      this.logger.error(
        `Error processing PaymentConfirmedEvent for orderId ${event.orderId}: ${error.message}`,
        error.stack,
      )
      // Implement robust error handling, e.g., retry mechanism for listener processing,
      // or move to a manual review queue.
    }
  }
}
