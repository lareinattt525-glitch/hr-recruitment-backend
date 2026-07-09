import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { IngestResumeDto } from './dto/ingest-resume.dto';
import { CandidatesService } from '../candidates/candidates.service';
import { PositionsService } from '../positions/positions.service';
import { ScoringService } from '../scoring/scoring.service';
import { CandidateStage } from '../common/enums';

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(Resume) private readonly repo: Repository<Resume>,
    private readonly candidatesService: CandidatesService,
    private readonly positionsService: PositionsService,
    private readonly scoringService: ScoringService,
  ) {}

  /** 邮件轮询服务 / 手动模拟收简历 入口。创建简历记录后立即触发AI评分 */
  async ingest(dto: IngestResumeDto): Promise<Resume> {
    const candidate = await this.candidatesService.findOrCreateByEmail({
      name: dto.candidateName, email: dto.candidateEmail, phone: dto.candidatePhone,
    });
    const resume = await this.repo.save(
      this.repo.create({
        candidateId: candidate.id, positionId: dto.positionId, fileUrl: dto.fileUrl,
        rawEmailId: dto.rawEmailId, rawText: dto.rawText, stage: CandidateStage.NEW,
      }),
    );
    // 简历入库后自动触发AI评分（异步，不阻塞入库响应）；生产环境建议改为消息队列任务
    this.triggerScoring(resume.id).catch((e) => console.error('自动评分失败', e));
    return resume;
  }

  private async triggerScoring(resumeId: string) {
    const resume = await this.findOne(resumeId);
    if (!resume.positionId) return; // 未匹配到职位时，需人工在HR界面指定后再评分
    const position = await this.positionsService.findOne(resume.positionId);
    await this.scoringService.scoreResume(resume, position);
  }

  async findOne(id: string): Promise<Resume> {
    const resume = await this.repo.findOne({ where: { id }, relations: ['candidate'] });
    if (!resume) throw new NotFoundException(`简历 ${id} 不存在`);
    return resume;
  }

  findAll() {
    return this.repo.find({ order: { receivedAt: 'DESC' }, relations: ['candidate'] });
  }

  async updateStage(id: string, stage: CandidateStage, rejectedReason?: string) {
    const resume = await this.findOne(id);
    resume.stage = stage;
    if (rejectedReason) resume.rejectedReason = rejectedReason;
    return this.repo.save(resume);
  }

  /** HR在"新简历/AI评分"阶段复核后，直接判断不合适、无需进入面试流程 */
  reject(id: string, reason: string) {
    return this.updateStage(id, CandidateStage.DONE, reason);
  }
}
