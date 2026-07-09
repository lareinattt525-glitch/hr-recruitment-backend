import { IsString } from 'class-validator';

export class RejectResumeDto {
  @IsString() reason: string;
}
