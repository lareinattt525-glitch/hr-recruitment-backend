import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { OperationLogsService } from './operation-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
