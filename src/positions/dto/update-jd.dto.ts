import { IsString } from 'class-validator';

export class UpdateJdDto {
  @IsString() jdGenerated: string;
}
