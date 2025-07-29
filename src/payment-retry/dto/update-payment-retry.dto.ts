import { IsString, IsEnum, IsOptional, IsObject, IsBoolean } from "class-validator"
import { PaymentStatus } from "../entities/payment-retry-queue.entity"

export class UpdatePaymentRetryDto {
  @IsString()
  @IsOptional()
  transactionHash?: string

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus

  @IsString()
  @IsOptional()
  lastErrorMessage?: string

  @IsObject()
  @IsOptional()
  errorDetails?: any

  @IsObject()
  @IsOptional()
  paymentMetadata?: any

  @IsBoolean()
  @IsOptional()
  notificationSent?: boolean
}
