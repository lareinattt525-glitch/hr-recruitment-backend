import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

// 标记某个接口需要哪些角色才能访问；不标注则默认"已登录即可访问"
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
