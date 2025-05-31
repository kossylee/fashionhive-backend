import { IsString, IsNumber, IsPositive, MinLength } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @MinLength(3)
  materialName: string;

  @IsString()
  description: string;

  @IsString()
  @MinLength(3)
  sku: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  reorderPoint: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}