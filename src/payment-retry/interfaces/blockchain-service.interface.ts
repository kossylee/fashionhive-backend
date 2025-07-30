export interface BlockchainTransactionResult {
  success: boolean
  transactionHash?: string
  error?: string
  errorDetails?: any
}

export interface BlockchainService {
  sendTransaction(
    recipientAddress: string,
    amount: string,
    currencySymbol: string,
    contractAddress?: string,
    metadata?: any,
  ): Promise<BlockchainTransactionResult>

  getTransactionStatus(transactionHash: string): Promise<{
    status: "pending" | "confirmed" | "failed"
    confirmations?: number
  }>
}
