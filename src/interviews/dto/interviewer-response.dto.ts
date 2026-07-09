import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class InterviewerResponseDto {
  @IsString() interviewId: string;
  @IsString() interviewerId: string;
  @IsBoolean() willingToInterview: boolean;
  @IsOptional() @IsArray() availableSlots?: string[];
}
