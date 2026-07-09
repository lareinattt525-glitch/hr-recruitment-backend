import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InterviewResult } from '../../common/enums';

export class RecordResultDto {
  @IsEnum(InterviewResult) result: InterviewResult;
  @IsOptional() @IsString() feedback?: string;
  // 仅业务一面场景需要：是否需要安排二面
  @IsOptional() needSecondRound?: boolean;
}
