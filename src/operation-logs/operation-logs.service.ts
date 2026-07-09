import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from './entities/operation-log.entity';

@Injectable()
export class OperationLogsService {
  constructor(@InjectRepository(OperationLog) private readonly repo: Repository<OperationLog>) {}

  record(entityType: string, entityId: string, action: string, operatorId?: string, before?: any, after?: any) {
    return this.repo.save(this.repo.create({ entityType, entityId, action, operatorId, before, after }));
  }

  findByEntity(entityType: string, entityId: string) {
    return this.repo.find({ where: { entityType, entityId }, order: { createdAt: 'DESC' } });
  }
}
