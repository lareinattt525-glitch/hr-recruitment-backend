import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev_secret_change_me_in_production',
    });
  }

  // 返回值会被挂到 request.user 上，供 @CurrentUser() 和 RolesGuard 使用
  async validate(payload: { sub: string; email: string; role: string; name: string }) {
    return { userId: payload.sub, email: payload.email, role: payload.role, name: payload.name };
  }
}
