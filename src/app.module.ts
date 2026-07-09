import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { typeOrmOptions } from './config/typeorm.config';

import { PositionsModule } from './positions/positions.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ResumesModule } from './resumes/resumes.module';
import { ScoringModule } from './scoring/scoring.module';
import { InterviewsModule } from './interviews/interviews.module';
import { OffersModule } from './offers/offers.module';
import { AiAdapterModule } from './ai-adapter/ai-adapter.module';
import { FeishuModule } from './feishu-integration/feishu.module';
import { EmailPollingModule } from './email-polling/email-polling.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmOptions),
    UsersModule,
    AuthModule,
    AiAdapterModule,
    FeishuModule,
    OperationLogsModule,
    CandidatesModule,
    PositionsModule,
    ScoringModule,
    ResumesModule,
    InterviewsModule,
    OffersModule,
    EmailPollingModule,
  ],
  controllers: [HealthController],
  providers: [
    // 全局默认：所有接口都需要登录（JWT），除非标了 @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 全局默认：标了 @Roles(...) 的接口按角色限制；未标注的只要登录了就能访问
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
