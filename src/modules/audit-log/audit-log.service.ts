import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(action: string, userId: number, performedBy: number, details?: any): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action,
      userId,
      performedBy,
      details: details || null,
    });
    return this.auditLogRepository.save(log);
  }
}
