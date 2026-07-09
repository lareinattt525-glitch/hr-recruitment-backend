import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// 实体统一在这里注册，供 TypeOrmModule 与 CLI migration 共用
import { Position } from '../positions/entities/position.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { ScoringCriteria } from '../scoring/entities/scoring-criteria.entity';
import { ScoreRecord } from '../scoring/entities/score-record.entity';
import { FeedbackLog } from '../scoring/entities/feedback-log.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { InterviewQuestionSuggestion } from '../interviews/entities/interview-question-suggestion.entity';
import { InterviewerResponse } from '../interviews/entities/interviewer-response.entity';
import { Offer } from '../offers/entities/offer.entity';
import { OfferConfirmation } from '../offers/entities/offer-confirmation.entity';
import { OperationLog } from '../operation-logs/entities/operation-log.entity';
import { User } from '../users/entities/user.entity';

const entities = [
  Position, Candidate, Resume, ScoringCriteria, ScoreRecord, FeedbackLog,
  Interview, InterviewQuestionSuggestion, InterviewerResponse, Offer, OfferConfirmation, OperationLog,
  User,
];

// 大多数云托管平台（Railway/Render等）会提供一个 DATABASE_URL 环境变量，直接用它连接更省事；
// 本地开发用 docker-compose 起的数据库则走下面的 DB_HOST 等单项配置。两种方式二选一，自动判断。
const databaseUrl = process.env.DATABASE_URL;
// 云托管Postgres几乎都要求SSL；本地docker-compose不需要，用 DB_SSL=false 关闭
const useSsl = process.env.DB_SSL === 'true' || (!!databaseUrl && process.env.DB_SSL !== 'false');

export const typeOrmOptions: DataSourceOptions = {
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'hr_user',
        password: process.env.DB_PASSWORD || 'change_me',
        database: process.env.DB_DATABASE || 'hr_recruitment',
      }),
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities,
  // 脚手架阶段用 synchronize 快速起步；进入正式开发后应改为 migration 管理表结构
  synchronize: true,
  logging: false,
} as DataSourceOptions;

export default new DataSource(typeOrmOptions);
