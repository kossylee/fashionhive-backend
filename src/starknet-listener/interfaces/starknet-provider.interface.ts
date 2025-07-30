export interface PaymentConfirmedEvent {
  transactionHash: string
  orderId: string // This links to your backend order
  amount: string
  currency: string
  recipientAddress: string
  contractAddress?: string
  blockNumber: number
  timestamp: Date
}

export interface StarkNetProvider {
  /**
   * Starts listening for PaymentConfirmed events and invokes the callback for each event.
   * @param callback The function to call when a PaymentConfirmedEvent is detected.
   */
  listenForPaymentConfirmedEvents(callback: (event: PaymentConfirmedEvent) => void): void

  /**
   * Stops listening for events.
   */
  stopListening(): void
}

export const STARKNET_PROVIDER = "STARKNET_PROVIDER"
