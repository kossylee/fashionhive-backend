import { Injectable, Logger } from "@nestjs/common"
import type { BlockchainService, BlockchainTransactionResult } from "../interfaces/blockchain-service.interface"

/**
 * Service to simulate StarkNet node failures for testing purposes
 */
@Injectable()
export class StarkNetSimulationService implements BlockchainService {
  private readonly logger = new Logger(StarkNetSimulationService.name)
  private failureRate = 0.7 // 70% failure rate for testing
  private consecutiveFailures = new Map<string, number>()

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate))
    this.logger.log(`StarkNet failure rate set to ${this.failureRate * 100}%`)
  }

  async sendTransaction(
    recipientAddress: string,
    amount: string,
    currencySymbol: string,
    contractAddress?: string,
    metadata?: any,
  ): Promise<BlockchainTransactionResult> {
    const transactionKey = `${recipientAddress}-${amount}-${currencySymbol}`
    const shouldFail = Math.random() < this.failureRate

    if (shouldFail) {
      const failures = this.consecutiveFailures.get(transactionKey) || 0
      this.consecutiveFailures.set(transactionKey, failures + 1)

      const errorTypes = [
        "StarkNet node temporarily unavailable",
        "Network timeout after 30 seconds",
        "Insufficient gas for transaction",
        "RPC endpoint not responding",
        "Transaction pool full",
        "Nonce too low",
        "Connection refused by StarkNet gateway",
      ]

      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]

      this.logger.error(`Simulated StarkNet failure: ${randomError}`)

      return {
        success: false,
        error: randomError,
        errorDetails: {
          timestamp: new Date().toISOString(),
          recipientAddress,
          amount,
          currencySymbol,
          contractAddress,
          metadata,
          consecutiveFailures: failures + 1,
          simulatedFailure: true,
        },
      }
    }

    // Success case
    this.consecutiveFailures.delete(transactionKey)
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`

    this.logger.log(`Simulated successful StarkNet transaction: ${transactionHash}`)

    return {
      success: true,
      transactionHash,
    }
  }

  async getTransactionStatus(transactionHash: string): Promise<{
    status: "pending" | "confirmed" | "failed"
    confirmations?: number
  }> {
    // Simulate various transaction statuses
    const statuses = ["pending", "confirmed", "failed"] as const
    const weights = [0.3, 0.6, 0.1] // 30% pending, 60% confirmed, 10% failed

    let randomValue = Math.random()
    let selectedStatus: (typeof statuses)[number] = "pending"

    for (let i = 0; i < statuses.length; i++) {
      if (randomValue < weights[i]) {
        selectedStatus = statuses[i]
        break
      }
      randomValue -= weights[i]
    }

    return {
      status: selectedStatus,
      confirmations: selectedStatus === "confirmed" ? Math.floor(Math.random() * 20) + 1 : 0,
    }
  }

  // Testing utilities
  simulateNodeRecovery(): void {
    this.setFailureRate(0.1) // Reduce failure rate to 10%
    this.consecutiveFailures.clear()
    this.logger.log("Simulated StarkNet node recovery")
  }

  simulateNodeFailure(): void {
    this.setFailureRate(0.9) // Increase failure rate to 90%
    this.logger.log("Simulated StarkNet node failure")
  }

  getConsecutiveFailures(): Map<string, number> {
    return new Map(this.consecutiveFailures)
  }
}
