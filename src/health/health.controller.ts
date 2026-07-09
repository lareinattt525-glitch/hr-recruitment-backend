import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

// 不需要登录就能访问，用来在浏览器里直接确认"服务是不是活的"
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  check() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
