import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { OfferConfirmation } from './entities/offer-confirmation.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus } from '../common/enums';
import { CandidatesService } from '../candidates/candidates.service';
import { PositionsService } from '../positions/positions.service';
import { AiAdapterService } from '../ai-adapter/ai-adapter.service';
import { FeishuService } from '../feishu-integration/feishu.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer) private readonly repo: Repository<Offer>,
    @InjectRepository(OfferConfirmation) private readonly confirmRepo: Repository<OfferConfirmation>,
    private readonly candidatesService: CandidatesService,
    private readonly positionsService: PositionsService,
    private readonly aiAdapter: AiAdapterService,
    private readonly feishu: FeishuService,
  ) {}

  /** HR谈薪完成后创建offer，并立即向HR/业务leader/COO群发飞书确认卡片（不走正式审批流）
   *  confirmers里的confirmerId，HR界面填的是邮箱；如果飞书已配置，这里会解析成真实open_id存库和寻址。 */
  async create(dto: CreateOfferDto) {
    const offer = await this.repo.save(
      this.repo.create({
        candidateId: dto.candidateId, positionId: dto.positionId, resumeId: dto.resumeId,
        salaryFinal: dto.salaryFinal, status: OfferStatus.PENDING_CONFIRM,
      }),
    );

    const resolvedConfirmers = await Promise.all(
      dto.confirmers.map(async (c) => {
        const resolvedOpenId = await this.feishu.getOpenIdByEmail(c.confirmerId);
        return { ...c, addressId: resolvedOpenId || c.confirmerId };
      }),
    );
    await this.confirmRepo.save(
      resolvedConfirmers.map((c) => this.confirmRepo.create({ offerId: offer.id, confirmerId: c.addressId, confirmerRole: c.confirmerRole })),
    );

    const candidate = await this.candidatesService.findOne(dto.candidateId);
    const position = await this.positionsService.findOne(dto.positionId);
    const card = this.feishu.buildOfferConfirmCard(candidate.name, position.title, dto.salaryFinal, offer.id);
    await this.feishu.sendCardToMultiple(resolvedConfirmers.map((c) => c.addressId), card);

    return offer;
  }

  /** 飞书群消息卡片回调：某一方点击"确认" */
  async handleConfirmCallback(offerId: string, confirmerId: string) {
    const confirmation = await this.confirmRepo.findOneBy({ offerId, confirmerId });
    if (!confirmation) throw new NotFoundException('未找到对应的确认记录，请确认open_id是否匹配');
    confirmation.confirmed = true;
    confirmation.confirmedAt = new Date();
    await this.confirmRepo.save(confirmation);

    const allConfirmations = await this.confirmRepo.findBy({ offerId });
    const allConfirmed = allConfirmations.every((c) => c.confirmed);
    if (allConfirmed) {
      await this.repo.update({ id: offerId }, { status: OfferStatus.CONFIRMED });
    }
    return { allConfirmed, confirmations: allConfirmations };
  }

  async getConfirmationStatus(offerId: string) {
    const confirmations = await this.confirmRepo.findBy({ offerId });
    return { confirmedCount: confirmations.filter((c) => c.confirmed).length, total: confirmations.length, confirmations };
  }

  /** 三方全部确认后才允许调用：生成offer邮件草稿 */
  async generateEmail(offerId: string) {
    const offer = await this.findOne(offerId);
    if (offer.status !== OfferStatus.CONFIRMED) throw new Error('三方尚未全部确认，无法生成offer邮件');
    const candidate = await this.candidatesService.findOne(offer.candidateId);
    const position = await this.positionsService.findOne(offer.positionId);
    offer.emailDraft = await this.aiAdapter.draftOfferEmail(candidate.name, position.title, offer.salaryFinal);
    return this.repo.save(offer);
  }

  /** 发送offer邮件（模拟；生产环境应调用真实SMTP服务并做发送状态回执处理） */
  async send(offerId: string) {
    const offer = await this.findOne(offerId);
    if (!offer.emailDraft) throw new Error('尚未生成offer邮件，请先调用 generateEmail');
    // TODO: 接入真实SMTP（如企业邮箱SMTP）发送邮件，收件地址取自 candidate.email
    offer.status = OfferStatus.SENT;
    offer.emailSentAt = new Date();
    return this.repo.save(offer);
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.repo.findOneBy({ id });
    if (!offer) throw new NotFoundException(`Offer ${id} 不存在`);
    return offer;
  }

  findByResume(resumeId: string) {
    return this.repo.findOne({ where: { resumeId }, order: { createdAt: 'DESC' } });
  }
}
