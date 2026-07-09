import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { PushToBusinessDto } from './dto/push-to-business.dto';
import { InterviewerResponseDto } from './dto/interviewer-response.dto';
import { RecordResultDto } from './dto/record-result.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller()
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}

  @Roles(UserRole.HR)
  @Post('resumes/:resumeId/hr-interview')
  scheduleHR(@Param('resumeId') resumeId: string) {
    return this.service.scheduleHRInterview(resumeId);
  }

  @Roles(UserRole.HR)
  @Get('interviews/:id/question-suggestions')
  generateQuestions(@Param('id') id: string) {
    return this.service.generateQuestionSuggestions(id);
  }

  @Roles(UserRole.HR, UserRole.INTERVIEWER)
  @Put('interviews/:id/result')
  recordResult(@Param('id') id: string, @Body() dto: RecordResultDto) {
    return this.service.recordResult(id, dto);
  }

  @Roles(UserRole.HR)
  @Post('interviews/:id/push-to-business')
  pushToBusiness(@Param('id') id: string, @Body() dto: PushToBusinessDto) {
    return this.service.pushToBusiness(id, dto.interviewerId);
  }

  // 飞书卡片回调（面试官在飞书里点击"同意/不同意"触发）：来自飞书服务器，不走网页登录，
  // 用签名校验代替（见 FeishuService.verifySignature）。
  // TODO: 接入真实飞书应用后，在这里用 headers 里的 timestamp/nonce/signature 调用
  // feishuService.verifySignature(...) 校验，校验失败直接拒绝，防止伪造回调。
  @Public()
  @Post('webhooks/feishu/card-callback')
  interviewerResponse(@Body() dto: InterviewerResponseDto) {
    return this.service.recordInterviewerResponse(dto);
  }

  @Roles(UserRole.HR, UserRole.INTERVIEWER)
  @Get('interviewers/:interviewerId/interviews')
  findByInterviewer(@Param('interviewerId') interviewerId: string) {
    return this.service.findByInterviewer(interviewerId);
  }

  @Roles(UserRole.HR, UserRole.INTERVIEWER)
  @Get('resumes/:resumeId/interviews')
  findByResume(@Param('resumeId') resumeId: string) {
    return this.service.findByResume(resumeId);
  }
}
