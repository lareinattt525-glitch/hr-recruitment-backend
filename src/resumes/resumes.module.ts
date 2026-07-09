import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from './entities/resume.entity';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { CandidatesModule } from '../candidates/candidates.module';
import { PositionsModule } from '../positions/positions.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resume]), CandidatesModule, PositionsModule, ScoringModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
