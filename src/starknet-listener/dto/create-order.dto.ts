import { IsString, IsNumberString, IsOptional, IsObject } from "class-validator"

export class CreateOrderDto {
  @IsString()
  orderId: string

  @IsString()
  userId: string

  @IsNumberString()
  paymentAmount: string

  @IsString()
  currencySymbol: string

  @IsString()
  recipientAddress: string

  @IsObject()
  @IsOptional()
  paymentMetadata?: any
}
