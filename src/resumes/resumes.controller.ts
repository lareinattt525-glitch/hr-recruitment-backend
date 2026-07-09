import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { IngestResumeDto } from './dto/ingest-resume.dto';
import { RejectResumeDto } from './dto/reject-resume.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class ResumesController {
  constructor(private readonly service: ResumesService) {}

  // 内部接口：邮件轮询服务解析后回调；也可用于HR界面"模拟收到简历"
  @Roles(UserRole.HR)
  @Post('internal/resumes/ingest')
  ingest(@Body() dto: IngestResumeDto) {
    return this.service.ingest(dto);
  }

  @Get('resumes')
  findAll() {
    return this.service.findAll();
  }

  @Get('resumes/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.HR)
  @Put('resumes/:id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectResumeDto) {
    return this.service.reject(id, dto.reason);
  }
}
