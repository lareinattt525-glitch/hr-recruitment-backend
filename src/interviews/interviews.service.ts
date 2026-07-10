import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewQuestionSuggestion } from './entities/interview-question-suggestion.entity';
import { InterviewerResponse } from './entities/interviewer-response.entity';
import { InterviewerResponseDto } from './dto/interviewer-response.dto';
import { RecordResultDto } from './dto/record-result.dto';
import { CandidateStage, InterviewRoundType, InterviewResult, InterviewStatus } from '../common/enums';
import { ResumesService } from '../resumes/resumes.service';
import { AiAdapterService } from '../ai-adapter/ai-adapter.service';
import { PositionsService } from '../positions/positions.service';
import { FeishuService } from '../feishu-integration/feishu.service';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview) private readonly repo: Repository<Interview>,
    @InjectRepository(InterviewQuestionSuggestion) private readonly questionRepo: Repository<InterviewQuestionSuggestion>,
    @InjectRepository(InterviewerResponse) private readonly responseRepo: Repository<InterviewerResponse>,
    private readonly resumesService: ResumesService,
    private readonly positionsService: PositionsService,
    private readonly aiAdapter: AiAdapterService,
    private readonly feishu: FeishuService,
  ) {}

  async scheduleHRInterview(resumeId: string) {
    const resume = await this.resumesService.findOne(resumeId);
    await this.resumesService.updateStage(resumeId, CandidateStage.HR_INTERVIEW);
    return this.repo.save(
      this.repo.create({
        candidateId: resume.candidateId, positionId: resume.positionId, resumeId,
        roundType: InterviewRoundType.HR, status: InterviewStatus.SCHEDULED,
      }),
    );
  }

  async generateQuestionSuggestions(interviewId: string) {
    const interview = await this.findOne(interviewId);
    const resume = await this.resumesService.findOne(interview.resumeId);
    const position = await this.positionsService.findOne(interview.positionId);
    const questions = await this.aiAdapter.suggestQuestions(resume.rawText, position.jdGenerated || position.requirementsRaw);
    return this.questionRepo.save(this.questionRepo.create({ interviewId, questions }));
  }

  async recordResult(interviewId: string, dto: RecordResultDto) {
    const interview = await this.findOne(interviewId);
    interview.result = dto.result;
    if (dto.feedback) interview.feedback = dto.feedback;
    interview.status = InterviewStatus.COMPLETED;
    await this.repo.save(interview);

    if (dto.result === InterviewResult.FAIL) {
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.DONE, `${interview.roundType}未通过`);
      return interview;
    }

    // HR面试通过 -> 推送业务面试官
    if (interview.roundType === InterviewRoundType.HR) {
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.BUSINESS_PENDING);
      // TODO: 调用 pushToBusiness 发送飞书卡片，这里留给上层Controller显式调用以便传入interviewerId
    } else if (interview.roundType === InterviewRoundType.BUSINESS_1ST) {
      const nextStage = dto.needSecondRound ? CandidateStage.BUSINESS_2ND : CandidateStage.FINAL;
      await this.resumesService.updateStage(interview.resumeId, nextStage);
    } else if (interview.roundType === InterviewRoundType.BUSINESS_2ND) {
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.FINAL);
    } else if (interview.roundType === InterviewRoundType.FINAL) {
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.OFFER);
    }
    return interview;
  }

  /** 推送候选人给业务面试官：发送飞书交互卡片（同意面试/暂不安排 + 时间段选择器）
   *  interviewerIdentifier 可以是邮箱（HR在界面里填的）；如果飞书已配置，会自动解析成真实open_id
   *  并以open_id存库寻址；如果飞书未配置，就原样存邮箱字符串（配合"模拟飞书"webhook走通流程）。 */
  async pushToBusiness(interviewId: string, interviewerIdentifier: string) {
    const interview = await this.findOne(interviewId);
    const resolvedOpenId = await this.feishu.getOpenIdByEmail(interviewerIdentifier);
    const addressId = resolvedOpenId || interviewerIdentifier;
    interview.interviewerId = addressId;
    await this.repo.save(interview);
    const resume = await this.resumesService.findOne(interview.resumeId);
    const position = await this.positionsService.findOne(interview.positionId);
    const card = this.feishu.buildCandidateCard(resume, position);
    await this.feishu.sendCardMessage(addressId, card);
    return interview;
  }

  /** 飞书卡片回调入口：面试官提交是否同意面试 + 可选时间段 */
  async recordInterviewerResponse(dto: InterviewerResponseDto) {
    const response = await this.responseRepo.save(this.responseRepo.create(dto));
    const interview = await this.findOne(dto.interviewId);
    if (dto.willingToInterview) {
      // 同意 -> 创建业务一面记录，进入 business_1st 阶段
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.BUSINESS_1ST);
      await this.repo.save(
        this.repo.create({
          candidateId: interview.candidateId, positionId: interview.positionId, resumeId: interview.resumeId,
          roundType: InterviewRoundType.BUSINESS_1ST, interviewerId: dto.interviewerId, status: InterviewStatus.SCHEDULED,
        }),
      );
    } else {
      await this.resumesService.updateStage(interview.resumeId, CandidateStage.DONE, '业务面试官暂不安排面试');
    }
    return response;
  }

  async findOne(id: string): Promise<Interview> {
    const interview = await this.repo.findOneBy({ id });
    if (!interview) throw new NotFoundException(`面试记录 ${id} 不存在`);
    return interview;
  }

  /** 面试官用邮箱登录我们的网页，但候选人卡片是按open_id寻址存库的（飞书接入后）——
   *  这里同时按"登录邮箱本身"和"该邮箱解析出的open_id"查询，两种情况都能查到。 */
  async findByInterviewer(interviewerIdentifier: string) {
    const resolvedOpenId = await this.feishu.getOpenIdByEmail(interviewerIdentifier);
    const candidates = resolvedOpenId && resolvedOpenId !== interviewerIdentifier
      ? [interviewerIdentifier, resolvedOpenId]
      : [interviewerIdentifier];
    return this.repo.find({ where: { interviewerId: In(candidates) }, order: { createdAt: 'DESC' } });
  }

  findByResume(resumeId: string) {
    return this.repo.find({ where: { resumeId }, order: { createdAt: 'DESC' } });
  }
}
