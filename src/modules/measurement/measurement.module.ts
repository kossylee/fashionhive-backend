import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measurement } from './entities/measurement.entity';
import { MeasurementService } from './measurement.service';
import { MeasurementEncryptionService } from './encryption/measurement-encryption.service';
import { ZkpService } from './zkp/zkp.service';
import { ZkpController } from './zkp/zkp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Measurement])],
  providers: [MeasurementService, MeasurementEncryptionService, ZkpService],
  controllers: [ZkpController],
  exports: [MeasurementService, MeasurementEncryptionService],
})
export class MeasurementModule {}
