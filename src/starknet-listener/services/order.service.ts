import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Order, OrderStatus } from "../entities/order.entity"
import type { UpdateOrderDto } from "../dto/update-order.dto"

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(private readonly orderRepository: Repository<Order>) {}

  async createOrder(
    orderId: string,
    userId: string,
    paymentAmount: string,
    currencySymbol: string,
    recipientAddress: string,
    paymentMetadata?: any,
  ): Promise<Order> {
    const existingOrder = await this.orderRepository.findOne({ where: { orderId } })
    if (existingOrder) {
      this.logger.warn(`Order with ID ${orderId} already exists. Returning existing order.`)
      return existingOrder
    }

    const order = this.orderRepository.create({
      orderId,
      userId,
      paymentAmount,
      currencySymbol,
      recipientAddress,
      paymentMetadata,
      status: OrderStatus.PENDING,
    })
    const savedOrder = await this.orderRepository.save(order)
    this.logger.log(`Created new order: ${savedOrder.orderId}`)
    return savedOrder
  }

  async findOrderByOrderId(orderId: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { orderId } })
  }

  async updateOrderStatus(orderId: string, updateDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { orderId } })

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`)
    }

    // Prevent updating if already paid and transaction hash is present
    if (order.status === OrderStatus.PAID && order.transactionHash && updateDto.transactionHash) {
      this.logger.warn(
        `Order ${orderId} already marked as PAID with transaction ${order.transactionHash}. Skipping update.`,
      )
      return order
    }

    // Update paidAt timestamp if status is changing to PAID
    if (updateDto.status === OrderStatus.PAID && order.status !== OrderStatus.PAID) {
      updateDto = { ...updateDto, paidAt: new Date() }
    }

    await this.orderRepository.update({ orderId }, updateDto)
    const updatedOrder = await this.orderRepository.findOne({ where: { orderId } })
    this.logger.log(`Updated order ${orderId} status to ${updatedOrder.status}`)
    return updatedOrder
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({ order: { createdAt: "DESC" } })
  }
}
