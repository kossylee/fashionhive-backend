import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

@Entity("orders")
@Index(["orderId"], { unique: true })
@Index(["status"])
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "order_id", unique: true })
  orderId: string // Your internal order ID

  @Column({ name: "user_id" })
  userId: string

  @Column({ name: "payment_amount", type: "decimal", precision: 18, scale: 8 })
  paymentAmount: string

  @Column({ name: "currency_symbol", length: 10 })
  currencySymbol: string

  @Column({ name: "recipient_address" })
  recipientAddress: string

  @Column({ name: "transaction_hash", nullable: true })
  transactionHash: string // Blockchain transaction hash

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus

  @Column({ name: "payment_metadata", type: "jsonb", nullable: true })
  paymentMetadata: any

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @Column({ name: "paid_at", type: "timestamp", nullable: true })
  paidAt: Date
}
