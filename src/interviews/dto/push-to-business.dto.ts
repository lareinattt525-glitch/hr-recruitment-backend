import { IsString } from 'class-validator';

export class PushToBusinessDto {
  @IsString() interviewerId: string; // 飞书 open_id
}
