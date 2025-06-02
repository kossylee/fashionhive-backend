import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { RedisService } from './redis.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface User {
  id: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  namespace: '/notifications',
})
export class NotificationsGatewayEnhanced 
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGatewayEnhanced.name);
  private connectedUsers = new Map<string, User>();
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private heartbeatTimer: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('NotificationsGateway initialized');
    this.setupHeartbeat();
  }

  async onModuleInit() {
    await this.redisService.subscribe('notification:broadcast', (message) => {
      this.handleBroadcastMessage(message);
    });

    await this.redisService.subscribe('notification:user', (message) => {
      this.handleUserMessage(message);
    });
  }

  private setupHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();
      this.connectedUsers.forEach((user, userId) => {
        const timeSinceLastActivity = now.getTime() - user.lastActivity.getTime();
        if (timeSinceLastActivity > this.HEARTBEAT_INTERVAL * 2) {
          this.logger.warn(`User ${userId} appears inactive, removing from connected users`);
          this.connectedUsers.delete(userId);
        }
      });
      
      this.server.emit('heartbeat', { timestamp: now.toISOString() });
    }, this.HEARTBEAT_INTERVAL);
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;
      
      const user: User = {
        id: userId,
        socketId: client.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
      };
      
      this.connectedUsers.set(userId, user);
      (client as any).userId = userId;
      client.join(`user_${userId}`);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      await this.sendInitialData(client, userId);
      
      await this.redisService.publish('user:connected', {
        userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Authentication failed during connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
      
      this.redisService.publish('user:disconnected', {
        userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private extractToken(client: Socket): string | null {
    return client.handshake.auth?.token || 
           client.handshake.headers?.authorization?.replace('Bearer ', '') ||
           client.handshake.query?.token as string;
  }

  private async sendInitialData(client: Socket, userId: string) {
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
      
      const recentNotifications = await this.notificationsService.getUserNotifications(userId, 1, 5);
      client.emit('initial_notifications', recentNotifications);
      
    } catch (error) {
      this.logger.error(`Failed to send initial data to user ${userId}`, error);
    }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    if (userId && this.connectedUsers.has(userId)) {
      const user = this.connectedUsers.get(userId);
      user.lastActivity = new Date();
      this.connectedUsers.set(userId, user);
    }
    client.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('mark_as_read')
  @UseGuards(WsJwtGuard)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;
    
    try {
      await this.notificationsService.markAsRead(data.notificationId, userId);
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      
      client.emit('notification_read', { 
        notificationId: data.notificationId,
        success: true 
      });
      client.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      this.logger.error(`Failed to mark notification as read for user ${userId}`, error);
      client.emit('notification_read', { 
        notificationId: data.notificationId,
        success: false,
        error: 'Failed to mark as read'
      });
    }
  }

  @SubscribeMessage('get_notifications')
  @UseGuards(WsJwtGuard)
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;
    
    try {
      const notifications = await this.notificationsService.getUserNotifications(
        userId,
        data.page || 1,
        data.limit || 20,
      );
      
      client.emit('notifications_list', notifications);
      
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}`, error);
      client.emit('notifications_error', { 
        message: 'Failed to fetch notifications' 
      });
    }
  }

  @SubscribeMessage('mark_all_read')
  @UseGuards(WsJwtGuard)
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    if (!userId) return;
    
    try {
      await this.notificationsService.markAllAsRead(userId);
      client.emit('all_notifications_read', { success: true });
      client.emit('unread_count', { count: 0 });
      
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}`, error);
      client.emit('all_notifications_read', { 
        success: false,
        error: 'Failed to mark all as read'
      });
    }
  }

  async sendNotificationToUser(userId: string, notification: any) {
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
      
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
      
      this.logger.log(`Notification sent directly to user ${userId}`);
    } else {
      await this.redisService.publish('notification:user', {
        userId,
        notification,
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`Notification published to Redis for user ${userId}`);
    }
  }

  private async handleBroadcastMessage(message: any) {
    this.logger.log('Handling broadcast message from Redis');
    this.server.emit(message.event, message.data);
  }

  private async handleUserMessage(message: any) {
    const { userId, notification } = message;
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
      
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
      
      this.logger.log(`Notification delivered via Redis to user ${userId}`);
    }
  }

  async broadcastSystemNotification(notification: any) {
    this.server.emit('system_notification', notification);
    
    await this.redisService.publish('notification:broadcast', {
      event: 'system_notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  async getServerStats() {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }
}
