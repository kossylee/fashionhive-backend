import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { Notification } from '../entities/notification.entity';
import { UserModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotificationPreference, Notification]),
    UserModule,
    forwardRef(() => OrderModule),

  ],
  providers: [NotificationsGateway, NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
