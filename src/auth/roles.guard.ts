import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums';

// 未标注 @Roles() 的接口：只要登录了就能访问。标注了的：必须是列出的角色之一。
// 管理员（ADMIN）永远放行，不受具体角色列表限制。
// 标了 @Public() 的接口（不管是方法级别还是类级别的@Roles()继承过来的）一律直接放行——
// public 就是 public，不应该再被角色限制卡住。
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    return requiredRoles.includes(user.role);
  }
}
