import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoringCriteria } from './entities/scoring-criteria.entity';
import { ScoreRecord } from './entities/score-record.entity';
import { FeedbackLog } from './entities/feedback-log.entity';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { CriteriaSource } from '../common/enums';
import { AiAdapterService } from '../ai-adapter/ai-adapter.service';
import { DEFAULT_SCORING_PROMPT } from './scoring.constants';
import { Resume } from '../resumes/entities/resume.entity';
import { Position } from '../positions/entities/position.entity';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(ScoringCriteria) private readonly criteriaRepo: Repository<ScoringCriteria>,
    @InjectRepository(ScoreRecord) private readonly scoreRepo: Repository<ScoreRecord>,
    @InjectRepository(FeedbackLog) private readonly feedbackRepo: Repository<FeedbackLog>,
    private readonly aiAdapter: AiAdapterService,
  ) {}

  async getActiveCriteria(positionId: string): Promise<ScoringCriteria> {
    const existing = await this.criteriaRepo.findOne({ where: { positionId, isActive: true } });
    if (existing) return existing;
    return this.criteriaRepo.save(
      this.criteriaRepo.create({
        positionId,
        version: 1,
        isActive: true,
        createdBy: CriteriaSource.SYSTEM,
        dimensions: { 技能匹配度: 0.3, 经验匹配度: 0.25, 教育背景匹配度: 0.15, 稳定性: 0.15, 行业相关度: 0.15 },
        promptTemplate: DEFAULT_SCORING_PROMPT,
      }),
    );
  }

  async scoreResume(resume: Resume, position: Position): Promise<ScoreRecord> {
    const criteria = await this.getActiveCriteria(position.id);
    const result = await this.aiAdapter.scoreResume(
      resume.rawText,
      position.jdGenerated || position.requirementsRaw,
      criteria,
    );
    return this.scoreRepo.save(
      this.scoreRepo.create({
        resumeId: resume.id,
        criteriaVersionId: criteria.id,
        score: result.total,
        dimensionScores: result.dimensions,
        aiReasoning: result.reasoning,
        recommendInterview: result.recommend,
      }),
    );
  }

  findScoreByResume(resumeId: string) {
    return this.scoreRepo.findOne({ where: { resumeId }, order: { createdAt: 'DESC' } });
  }

  submitFeedback(scoreRecordId: string, dto: SubmitFeedbackDto) {
    return this.feedbackRepo.save(this.feedbackRepo.create({ scoreRecordId, ...dto }));
  }

  /**
   * 汇总近期"不准确"反馈，调用AI生成评分标准优化建议，生成新版本（草稿态 isActive=false）。
   * 必须由HR显式调用 activateCriteria 才会生效 —— 避免AI评分标准"自我强化"跑偏。
   */
  async optimizeCriteria(positionId: string) {
    const current = await this.getActiveCriteria(positionId);
    const badFeedback = await this.feedbackRepo.find({ where: { isAccurate: false }, take: 20, order: { createdAt: 'DESC' } });
    // TODO: 严谨实现应 join score_records -> resumes 按 positionId 过滤，这里为脚手架简化版本
    const suggestion = await this.aiAdapter.suggestCriteriaOptimization(current, badFeedback);
    return this.criteriaRepo.save(
      this.criteriaRepo.create({
        positionId,
        version: current.version + 1,
        isActive: false,
        createdBy: CriteriaSource.HR_FEEDBACK_OPTIMIZED,
        dimensions: suggestion.dimensions ?? current.dimensions,
        promptTemplate: suggestion.promptTemplate ?? current.promptTemplate,
      }),
    );
  }

  async activateCriteria(criteriaId: string) {
    const criteria = await this.criteriaRepo.findOneByOrFail({ id: criteriaId });
    await this.criteriaRepo.update({ positionId: criteria.positionId, isActive: true }, { isActive: false });
    criteria.isActive = true;
    return this.criteriaRepo.save(criteria);
  }
}
