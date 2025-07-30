import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  FAILED = "failed",
  COMPLETED = "completed",
  EXHAUSTED = "exhausted",
}

export enum BlockchainNetwork {
  STARKNET = "starknet",
  ETHEREUM = "ethereum",
  POLYGON = "polygon",
}

@Entity("payment_retry_queue")
@Index(["status", "nextRetryAt"])
@Index(["idempotencyKey"], { unique: true })
export class PaymentRetryQueue {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "idempotency_key", unique: true })
  idempotencyKey: string

  @Column({ name: "user_id" })
  userId: string

  @Column({ name: "user_email" })
  userEmail: string

  @Column({ name: "transaction_hash", nullable: true })
  transactionHash: string

  @Column({ name: "blockchain_network", type: "enum", enum: BlockchainNetwork, default: BlockchainNetwork.STARKNET })
  blockchainNetwork: BlockchainNetwork

  @Column({ name: "payment_amount", type: "decimal", precision: 18, scale: 8 })
  paymentAmount: string

  @Column({ name: "currency_symbol", length: 10 })
  currencySymbol: string

  @Column({ name: "recipient_address" })
  recipientAddress: string

  @Column({ name: "contract_address", nullable: true })
  contractAddress: string

  @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus

  @Column({ name: "retry_count", default: 0 })
  retryCount: number

  @Column({ name: "max_retry_attempts", default: 3 })
  maxRetryAttempts: number

  @Column({ name: "next_retry_at", type: "timestamp", nullable: true })
  nextRetryAt: Date

  @Column({ name: "last_error_message", type: "text", nullable: true })
  lastErrorMessage: string

  @Column({ name: "error_details", type: "jsonb", nullable: true })
  errorDetails: any

  @Column({ name: "payment_metadata", type: "jsonb", nullable: true })
  paymentMetadata: any

  @Column({ name: "notification_sent", default: false })
  notificationSent: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date

  @Column({ name: "exhausted_at", type: "timestamp", nullable: true })
  exhaustedAt: Date
}
