import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      
      this.connectedUsers.set(payload.sub, client.id);
      
      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
      
      client.join(`user_${payload.sub}`);
      
      const unreadCount = await this.notificationsService.getUnreadCount(payload.sub);
      client.emit('unread_count', { count: unreadCount });
      
    } catch (error) {
      this.logger.error('Authentication failed during connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('mark_as_read')
  @UseGuards(WsJwtGuard)
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) return;
    
    await this.notificationsService.markAsRead(data.notificationId, client.userId);
    const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
    
    client.emit('unread_count', { count: unreadCount });
  }

  @SubscribeMessage('get_notifications')
  @UseGuards(WsJwtGuard)
  async handleGetNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    if (!client.userId) return;
    
    const notifications = await this.notificationsService.getUserNotifications(
      client.userId,
      data.page || 1,
      data.limit || 20,
    );
    
    client.emit('notifications_list', notifications);
  }

  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
      
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
      
      this.logger.log(`Notification sent to user ${userId}`);
    } else {
      this.logger.log(`User ${userId} is not connected, notification stored for later`);
    }
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
