import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @Roles('admin')
  getRevenue(@Query('range') range: string) {
    return this.analyticsService.getRevenue(range);
  }

  @Get('orders')
  @Roles('admin')
  getOrders(@Query('status') status: string) {
    return this.analyticsService.getOrders(status);
  }

  @Get('user-growth')
  @Roles('admin')
  getUserGrowth() {
    return this.analyticsService.getUserGrowth();
  }
}
