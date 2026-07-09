import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailPollingService } from './email-polling.service';
import { ResumesModule } from '../resumes/resumes.module';

@Module({
  imports: [ScheduleModule.forRoot(), ResumesModule],
  providers: [EmailPollingService],
})
export class EmailPollingModule {}
