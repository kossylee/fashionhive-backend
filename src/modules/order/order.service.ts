import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { TailorService } from '../tailor/tailor.service';
import { TailorSpecialty } from '../tailor/entities/tailor.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private inventoryService: InventoryService,
    private tailorService: TailorService,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.orderRepository.create({
        customer: { id: createOrderDto.customerId },
        status: OrderStatus.DRAFT,
        shippingAddress: createOrderDto.shippingAddress,
        statusHistory: [{
          status: OrderStatus.DRAFT,
          timestamp: new Date(),
          note: 'Order created'
        }]
      });

      const items = createOrderDto.items.map(item => 
        this.orderItemRepository.create({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customizations: item.customizations,
          totalPrice: item.quantity * item.unitPrice
        })
      );

      order.items = items;
      order.totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      return order;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['customer', 'items', 'tailor']
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'tailor']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: number, newStatus: OrderStatus, note?: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.findOne(id);
      
      if (!this.isValidStateTransition(order.status, newStatus)) {
        throw new BadRequestException(`Invalid state transition from ${order.status} to ${newStatus}`);
      }

      // Lock the order for update
      await queryRunner.manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: newStatus })
        .where("id = :id", { id })
        .andWhere("status = :currentStatus", { currentStatus: order.status })
        .execute();

      // Perform state-specific actions within transaction
      switch (newStatus) {
        case OrderStatus.PAID:
          await this.checkAndReserveInventory(order, queryRunner);
          break;
        case OrderStatus.IN_PRODUCTION:
          await this.assignTailor(order, queryRunner);
          break;
        case OrderStatus.CANCELLED:
          await this.releaseInventory(order, queryRunner);
          if (order.tailor) {
            await this.tailorService.updateTailorWorkload(order.tailor.id, -1);
          }
          break;
      }

      // Update status history
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `Status updated to ${newStatus}`
      });

      const updatedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      return updatedOrder;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === '23503') { // Foreign key violation
        throw new BadRequestException('Referenced resource not found');
      }
      if (err.code === '40001') { // Serialization failure
        throw new ConflictException('Concurrent update detected, please try again');
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private isValidStateTransition(currentState: OrderStatus, newState: OrderStatus): boolean {
    const validTransitions = {
      [OrderStatus.DRAFT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
      [OrderStatus.IN_PRODUCTION]: [OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED],
      [OrderStatus.READY_TO_SHIP]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[currentState].includes(newState);
  }

  private async checkAndReserveInventory(order: Order, queryRunner): Promise<void> {
    for (const item of order.items) {
      const inventoryItem = await queryRunner.manager
        .createQueryBuilder()
        .from('inventory')
        .where('id = :id', { id: item.productName })
        .andWhere('quantity >= :quantity', { quantity: item.quantity })
        .forUpdate()
        .getOne();

      if (!inventoryItem) {
        throw new BadRequestException(`Insufficient stock for ${item.productName}`);
      }

      await queryRunner.manager
        .createQueryBuilder()
        .update('inventory')
        .set({ quantity: () => `quantity - ${item.quantity}` })
        .where('id = :id', { id: item.productName })
        .execute();
    }
  }

  private async releaseInventory(order: Order, queryRunner): Promise<void> {
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await queryRunner.manager
          .createQueryBuilder()
          .update('inventory')
          .set({ quantity: () => `quantity + ${item.quantity}` })
          .where('id = :id', { id: item.productName })
          .execute();
      }
    }
  }

  private async assignTailor(order: Order, queryRunner): Promise<void> {
    const requiredSpecialties = this.determineRequiredSpecialties(order);
    
    const tailor = await this.tailorService.findAvailableTailorForOrder(requiredSpecialties);
    if (!tailor) {
      throw new ConflictException('No available tailor with matching specialties found');
    }

    // Lock the tailor record
    const lockedTailor = await queryRunner.manager
      .createQueryBuilder()
      .from('tailor')
      .where('id = :id', { id: tailor.id })
      .andWhere('isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('currentWorkload < maxWeeklyCapacity')
      .forUpdate()
      .getOne();

    if (!lockedTailor) {
      throw new ConflictException('Selected tailor is no longer available');
    }

    order.tailor = tailor;
    await this.tailorService.updateTailorWorkload(tailor.id, 1);
  }

  private determineRequiredSpecialties(order: Order): TailorSpecialty[] {
    const specialties = new Set<TailorSpecialty>();
    
    // Logic to determine required specialties based on order items
    for (const item of order.items) {
      if (item.customizations?.type === 'suit') {
        specialties.add(TailorSpecialty.SUITS);
      } else if (item.customizations?.type === 'dress') {
        specialties.add(TailorSpecialty.DRESSES);
      }
      // Add more specialty determinations based on your needs
    }
    
    return Array.from(specialties);
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('Can only delete draft or cancelled orders');
    }
    await this.orderRepository.remove(order);
  }
}