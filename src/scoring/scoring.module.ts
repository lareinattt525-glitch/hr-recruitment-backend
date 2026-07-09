import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoringCriteria } from './entities/scoring-criteria.entity';
import { ScoreRecord } from './entities/score-record.entity';
import { FeedbackLog } from './entities/feedback-log.entity';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScoringCriteria, ScoreRecord, FeedbackLog]), AiAdapterModule],
  controllers: [ScoringController],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
