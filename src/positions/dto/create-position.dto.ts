import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePositionDto {
  @IsString() title: string;
  @IsString() department: string;

  @IsInt() @Min(1) headcount: number;

  @IsOptional() @IsInt() salaryMin?: number;
  @IsOptional() @IsInt() salaryMax?: number;

  @IsString() requirementsRaw: string;

  @IsOptional() @IsString() requesterId?: string;
}
