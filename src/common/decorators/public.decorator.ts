import { SetMetadata } from '@nestjs/common';

// 标记某个接口不需要登录即可访问（如登录接口本身、飞书webhook回调）
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
