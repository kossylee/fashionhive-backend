import { IsString, IsEnum, IsOptional, IsObject } from "class-validator"
import { OrderStatus } from "../entities/order.entity"

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  transactionHash?: string

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus

  @IsObject()
  @IsOptional()
  paymentMetadata?: any
}
