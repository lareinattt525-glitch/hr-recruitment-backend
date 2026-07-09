import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('邮箱或密码不正确');
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('邮箱或密码不正确');
    return this.buildTokenResponse(user);
  }

  /**
   * 通过一次性 setupKey 创建第一个管理员账号——专门给"部署到云端、没有命令行/数据库直连权限"
   * 的场景用。安全性靠两层保证：① setupKey 必须和环境变量 ADMIN_SETUP_KEY 一致；
   * ② 系统里必须一个账号都还没有（用过一次之后，即使setupKey泄露也无法再次调用）。
   */
  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const expectedKey = this.config.get<string>('ADMIN_SETUP_KEY');
    if (!expectedKey) {
      throw new ForbiddenException('服务端未配置 ADMIN_SETUP_KEY，无法通过接口创建管理员账号');
    }
    if (dto.setupKey !== expectedKey) {
      throw new ForbiddenException('setupKey 不正确');
    }
    const existingCount = await this.usersService.count();
    if (existingCount > 0) {
      throw new ForbiddenException('系统已经存在账号了，出于安全考虑不能再通过这个接口创建管理员');
    }
    const user = await this.usersService.create({
      email: dto.email, name: dto.name, password: dto.password, role: UserRole.ADMIN,
    });
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return { accessToken: this.jwtService.sign(payload), user };
  }

  private buildTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
