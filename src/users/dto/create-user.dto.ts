import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() name: string;
  @MinLength(8, { message: '密码至少8位' }) password: string;
  @IsEnum(UserRole) role: UserRole;
}
