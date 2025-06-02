import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { UpdatePreferencesDto } from './dtos/update-preferences.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotificationPreference) 
    private preferenceRepository: Repository<UserNotificationPreference>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const isEnabled = await this.isNotificationEnabled(
      createNotificationDto.userId,
      createNotificationDto.type,
    );

    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);

    if (isEnabled) {
      await this.notificationsGateway.sendNotificationToUser(
        createNotificationDto.userId,
        savedNotification,
      );
    }

    return savedNotification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { userId },
    });
  }

  async updateUserPreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserNotificationPreference[]> {
    const { preferences } = updatePreferencesDto;

    for (const pref of preferences) {
      await this.preferenceRepository.upsert(
        {
          userId,
          notificationType: pref.notificationType,
          isEnabled: pref.isEnabled,
          pushEnabled: pref.pushEnabled,
          emailEnabled: pref.emailEnabled,
        },
        ['userId', 'notificationType'],
      );
    }

    return this.getUserPreferences(userId);
  }

  private async isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId, notificationType: type },
    });

    return preference?.isEnabled ?? true; 
  }

  async notifyOrderShipped(userId: string, orderId: string, trackingNumber?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_SHIPPED,
      title: 'Order Shipped! 📦',
      message: `Your order has been shipped and is on its way!`,
      data: { orderId, trackingNumber },
    });
  }

  async notifyOrderDelivered(userId: string, orderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order Delivered! 🎉',
      message: `Your order has been successfully delivered. We hope you love it!`,
      data: { orderId },
    });
  }

  async notifyOrderConfirmed(userId: string, orderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Order Confirmed ✅',
      message: `Your order has been confirmed and is being prepared.`,
      data: { orderId },
    });
  }

  async notifyOrderCancelled(userId: string, orderId: string, reason?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled ❌',
      message: `Your order has been cancelled. ${reason || 'Please contact support if you have questions.'}`,
      data: { orderId, reason },
    });
  }
}
