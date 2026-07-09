import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewQuestionSuggestion } from './entities/interview-question-suggestion.entity';
import { InterviewerResponse } from './entities/interviewer-response.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { ResumesModule } from '../resumes/resumes.module';
import { PositionsModule } from '../positions/positions.module';
import { AiAdapterModule } from '../ai-adapter/ai-adapter.module';
import { FeishuModule } from '../feishu-integration/feishu.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, InterviewQuestionSuggestion, InterviewerResponse]),
    ResumesModule, PositionsModule, AiAdapterModule, FeishuModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}
