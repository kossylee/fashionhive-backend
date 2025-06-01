import { Controller, Get } from '@nestjs/common';
import { NotificationsGatewayEnhanced } from './notifications.gateway.enhanced';
import { NotificationsService } from './notifications.service';
import { RedisService } from './redis.service';

@Controller('notifications/health')
export class NotificationsHealthController {
  constructor(
    private readonly notificationsGateway: NotificationsGatewayEnhanced,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
      serverStats: await this.notificationsGateway.getServerStats(),
    };
  }

  @Get('stats')
  async getDetailedStats() {
    const connectedUsers = this.notificationsGateway.getConnectedUsers();
    
    return {
      connectedUsers: {
        count: connectedUsers.length,
        users: connectedUsers,
      },
      serverStats: await this.notificationsGateway.getServerStats(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test')
  async testNotification() {
    await this.notificationsGateway.broadcastSystemNotification({
      type: 'system_test',
      title: 'System Test',
      message: 'This is a test notification from the health check endpoint',
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Test notification sent to all connected users',
      connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
    };
  }
}
