import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SubmitFeedbackDto {
  @IsString() hrUserId: string;
  @IsBoolean() isAccurate: boolean;
  @IsOptional() @IsString() correctJudgement?: string;
  @IsOptional() @IsString() feedbackReason?: string;
}
