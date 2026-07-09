import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 控制器里用 @CurrentUser() user 直接拿到当前登录人信息（id/email/role/name）
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
