import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';

@Module({
  imports: [TypeOrmModule.forFeature([Position]), AiAdapterModule],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}
