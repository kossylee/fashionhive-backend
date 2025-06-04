import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { OrderItem } from "./order-item.entity";
import { Tailor } from "../../tailor/entities/tailor.entity";

export enum OrderStatus {
  DRAFT = "draft",
  PAID = "paid",
  IN_PRODUCTION = "in_production",
  READY_TO_SHIP = "ready_to_ship",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

@Entity()
export class Order {
  userId(userId: any, orderId: string) {
    throw new Error('Method not implemented.');
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  status: OrderStatus;

  @ManyToOne(() => User)
  customer: User;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => Tailor, tailor => tailor.orders)
  tailor: Tailor;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column('json', { default: [] })
  statusHistory: { status: OrderStatus; timestamp: Date; note?: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}