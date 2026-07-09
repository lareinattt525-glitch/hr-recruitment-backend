import { IsOptional, IsString } from 'class-validator';

// 邮件轮询服务解析邮件后回调该接口时使用（内部调用，不对外开放）
export class IngestResumeDto {
  @IsString() candidateName: string;
  @IsOptional() @IsString() candidateEmail?: string;
  @IsOptional() @IsString() candidatePhone?: string;
  @IsOptional() @IsString() positionId?: string;
  @IsString() fileUrl: string;
  @IsOptional() @IsString() rawEmailId?: string;
  @IsString() rawText: string;
}
