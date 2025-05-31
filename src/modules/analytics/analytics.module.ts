// Analytics module for admin dashboard insights
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { Order } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { RolesGuard } from './roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AnalyticsModule {}
