import { IsString, IsEmail, IsNumber, IsEnum, IsOptional, IsObject, Min, Max } from "class-validator"
import { BlockchainNetwork } from "../entities/payment-retry-queue.entity"

export class CreatePaymentRetryDto {
  @IsString()
  idempotencyKey: string

  @IsString()
  userId: string

  @IsEmail()
  userEmail: string

  @IsString()
  @IsOptional()
  transactionHash?: string

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  blockchainNetwork?: BlockchainNetwork = BlockchainNetwork.STARKNET

  @IsString()
  paymentAmount: string

  @IsString()
  currencySymbol: string

  @IsString()
  recipientAddress: string

  @IsString()
  @IsOptional()
  contractAddress?: string

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxRetryAttempts?: number = 3

  @IsObject()
  @IsOptional()
  paymentMetadata?: any
}
