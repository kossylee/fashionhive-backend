import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { UpdatePreferencesDto } from './dtos/update-preferences.dto';

@UseGuards(WsJwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, +page, +limit);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    await this.notificationsService.markAsRead(notificationId, req.user.id);
    return { success: true };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Get('preferences')
  async getPreferences(@Request() req) {
    return this.notificationsService.getUserPreferences(req.user.id);
  }

  @Post('preferences')
  async updatePreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updateUserPreferences(req.user.id, updatePreferencesDto);
  }
}
