import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement } from './entities/measurement.entity';
import { MeasurementEncryptionService } from './encryption/measurement-encryption.service';
import { CreateMeasurementDto } from './dtos/create-measurement.dto';

@Injectable()
export class MeasurementService {
  constructor(
    @InjectRepository(Measurement)
    private measurementRepo: Repository<Measurement>,
    private encryptionService: MeasurementEncryptionService,
  ) {}

  async create(dto: CreateMeasurementDto): Promise<Measurement> {
    const encryptedData = this.encryptionService.encrypt(JSON.stringify(dto.measurement));
    const measurement = this.measurementRepo.create({
      user: { id: dto.userId } as any,
      encryptedData,
    });
    return this.measurementRepo.save(measurement);
  }

  async getDecryptedMeasurement(id: string): Promise<any> {
    const measurement = await this.measurementRepo.findOne({ where: { id }, relations: ['user'] });
    if (!measurement) return null;
    const decrypted = this.encryptionService.decrypt(measurement.encryptedData);
    return JSON.parse(decrypted);
  }
}
