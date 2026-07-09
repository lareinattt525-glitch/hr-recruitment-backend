import { IsEmail, IsString, MinLength } from 'class-validator';

// 用于"部署到云端后、还没有任何账号、又没法用命令行"这种场景，通过一次性密钥创建第一个管理员账号
export class BootstrapAdminDto {
  @IsString() setupKey: string;
  @IsEmail() email: string;
  @IsString() name: string;
  @MinLength(8, { message: '密码至少8位' }) password: string;
}
