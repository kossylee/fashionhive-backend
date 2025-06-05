import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { CreateMeasurementDto } from './dtos/create-measurement.dto';

@Controller('measurements')
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post()
  async createMeasurement(@Body() dto: CreateMeasurementDto) {
    return this.measurementService.create(dto);
  }

  @Get(':id')
  async getDecryptedMeasurement(@Param('id') id: string) {
    return this.measurementService.getDecryptedMeasurement(id);
  }
}
