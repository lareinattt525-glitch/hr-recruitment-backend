import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

// 评分详情、薪资等属于敏感信息，整个控制器限制为HR可见（管理员默认放行，见RolesGuard）
@Roles(UserRole.HR)
@Controller()
export class ScoringController {
  constructor(private readonly service: ScoringService) {}

  @Get('resumes/:resumeId/score')
  getScore(@Param('resumeId') resumeId: string) {
    return this.service.findScoreByResume(resumeId);
  }

  @Post('score-records/:id/feedback')
  submitFeedback(@Param('id') id: string, @Body() dto: SubmitFeedbackDto) {
    return this.service.submitFeedback(id, dto);
  }

  @Post('scoring-criteria/:positionId/optimize')
  optimize(@Param('positionId') positionId: string) {
    return this.service.optimizeCriteria(positionId);
  }

  @Put('scoring-criteria/:id/activate')
  activate(@Param('id') id: string) {
    return this.service.activateCriteria(id);
  }
}
