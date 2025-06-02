import { IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../../entities/notification.entity';

class NotificationPreferenceDto {
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsBoolean()
  isEnabled: boolean;

  @IsBoolean()
  pushEnabled: boolean;

  @IsBoolean()
  emailEnabled: boolean;
}

export class UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceDto)
  preferences: NotificationPreferenceDto[];
}
