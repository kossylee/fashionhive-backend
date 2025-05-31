import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getRevenue(range: string) {
    // Default to 30 days if not provided
    const days = range ? parseInt(range) : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { sum } = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .where('order.createdAt >= :since', { since })
      .getRawOne();
    return { revenue: parseFloat(sum) || 0, range: days + 'd' };
  }

  async getOrders(status: string) {
    const qb = this.orderRepository.createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status');
    if (status) qb.having('order.status = :status', { status });
    const result = await qb.getRawMany();
    return { orders: result };
  }

  async getUserGrowth() {
    // Group users by creation date (assuming createdAt exists)
    const result = await this.userRepository.query(
      `SELECT DATE("createdAt") as date, COUNT(*) as count FROM "user" GROUP BY date ORDER BY date DESC LIMIT 30`
    );
    return { userGrowth: result };
  }
}
