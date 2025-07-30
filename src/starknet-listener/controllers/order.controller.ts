import { Controller, Get, Post, Param, Patch, NotFoundException } from "@nestjs/common"
import type { OrderService } from "../services/order.service"
import type { CreateOrderDto } from "../dto/create-order.dto" // Assuming you'll create this DTO for API
import type { UpdateOrderDto } from "../dto/update-order.dto"
import type { Order } from "../entities/order.entity"

// This controller is for demonstrating order management, not directly part of the listener
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.orderService.createOrder(
      createOrderDto.orderId,
      createOrderDto.userId,
      createOrderDto.paymentAmount,
      createOrderDto.currencySymbol,
      createOrderDto.recipientAddress,
      createOrderDto.paymentMetadata,
    )
  }

  @Get(":orderId")
  async getOrderByOrderId(@Param("orderId") orderId: string): Promise<Order> {
    const order = await this.orderService.findOrderByOrderId(orderId)
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`)
    }
    return order
  }

  @Get()
  async getAllOrders(): Promise<Order[]> {
    return this.orderService.getAllOrders()
  }

  @Patch(":orderId")
  async updateOrder(@Param("orderId") orderId: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.orderService.updateOrderStatus(orderId, updateOrderDto)
  }
}
