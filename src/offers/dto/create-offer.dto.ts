import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfirmerRole } from '../../common/enums';

class ConfirmerDto {
  @IsString() confirmerId: string;
  @IsEnum(ConfirmerRole) confirmerRole: ConfirmerRole;
}

export class CreateOfferDto {
  @IsString() resumeId: string;
  @IsString() candidateId: string;
  @IsString() positionId: string;
  @IsString() salaryFinal: string;

  // HR在薪资沟通完成后一次性传入HR/业务leader/COO三方的飞书open_id，用于发起群消息确认
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmerDto) confirmers: ConfirmerDto[];
}
