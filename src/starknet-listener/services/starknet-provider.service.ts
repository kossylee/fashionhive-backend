import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common"
import type { PaymentConfirmedEvent, StarkNetProvider } from "../interfaces/starknet-provider.interface"

/**
 * This service simulates a StarkNet event listener.
 * In a real application, this would connect to a StarkNet node
 * (e.g., using starknet.js or starknet-py for Python backend)
 * and subscribe to smart contract events.
 */
@Injectable()
export class StarkNetProviderService implements StarkNetProvider, OnModuleDestroy {
  private readonly logger = new Logger(StarkNetProviderService.name)
  private eventInterval: NodeJS.Timeout | null = null
  private eventCounter = 0

  // Simulate a list of pending orders that might get confirmed
  private simulatedPendingOrders = [
    {
      orderId: "order-abc-123",
      amount: "50.00",
      currency: "ETH",
      recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
      contractAddress: "0xContractAddr1",
    },
    {
      orderId: "order-def-456",
      amount: "25.75",
      currency: "USDC",
      recipientAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      contractAddress: "0xContractAddr2",
    },
    {
      orderId: "order-ghi-789",
      amount: "120.00",
      currency: "DAI",
      recipientAddress: "0x9876543210fedcba9876543210fedcba98765432",
      contractAddress: "0xContractAddr1",
    },
  ]

  listenForPaymentConfirmedEvents(callback: (event: PaymentConfirmedEvent) => void): void {
    if (this.eventInterval) {
      this.logger.warn("Already listening for StarkNet events. Stopping previous listener.")
      this.stopListening()
    }

    this.logger.log("Starting simulated StarkNet event listener...")

    this.eventInterval = setInterval(() => {
      // Simulate a random event from our pending orders
      if (this.simulatedPendingOrders.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.simulatedPendingOrders.length)
        const orderToConfirm = this.simulatedPendingOrders[randomIndex]

        const event: PaymentConfirmedEvent = {
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          orderId: orderToConfirm.orderId,
          amount: orderToConfirm.amount,
          currency: orderToConfirm.currency,
          recipientAddress: orderToConfirm.recipientAddress,
          contractAddress: orderToConfirm.contractAddress,
          blockNumber: 100000 + this.eventCounter,
          timestamp: new Date(),
        }

        this.logger.debug(`Simulating PaymentConfirmedEvent for orderId: ${event.orderId}`)
        callback(event)
        this.eventCounter++

        // Optionally remove the order from the pending list to simulate it being processed
        // this.simulatedPendingOrders.splice(randomIndex, 1);
      } else {
        this.logger.log("No more simulated pending orders to confirm. You can add more to the list.")
        // Optionally stop listening if no more events to simulate
        // this.stopListening();
      }
    }, 5000) // Emit an event every 5 seconds
  }

  stopListening(): void {
    if (this.eventInterval) {
      clearInterval(this.eventInterval)
      this.eventInterval = null
      this.logger.log("Stopped simulated StarkNet event listener.")
    }
  }

  onModuleDestroy(): void {
    this.stopListening()
  }
}
