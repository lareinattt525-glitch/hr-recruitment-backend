import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Resume } from '../resumes/entities/resume.entity';
import { Position } from '../positions/entities/position.entity';

@Injectable()
export class FeishuService {
  private tenantToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  private isConfigured(): boolean {
    return !!(this.config.get('FEISHU_APP_ID') && this.config.get('FEISHU_APP_SECRET'));
  }

  private async getTenantAccessToken(): Promise<string> {
    if (this.tenantToken && Date.now() < this.tokenExpiresAt) return this.tenantToken;
    const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.config.get('FEISHU_APP_ID'),
        app_secret: this.config.get('FEISHU_APP_SECRET'),
      }),
    });
    const data = await res.json();
    const token: string | undefined = data.tenant_access_token;
    if (!token) throw new Error(`获取飞书tenant_access_token失败: ${JSON.stringify(data)}`);
    this.tenantToken = token;
    this.tokenExpiresAt = Date.now() + (data.expire - 60) * 1000;
    return token;
  }

  /** 发送交互式消息卡片给指定用户（open_id） */
  async sendCardMessage(receiveOpenId: string, card: Record<string, any>) {
    if (!this.isConfigured()) {
      // 还没配置飞书应用凭证：跳过真实发送，但不阻塞业务状态流转，方便在接入飞书之前先把其他功能跑起来
      console.warn('[FeishuService] 未配置 FEISHU_APP_ID/FEISHU_APP_SECRET，跳过实际发送消息卡片');
      return { skipped: true, reason: 'feishu_not_configured' };
    }
    const token = await this.getTenantAccessToken();
    const res = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receive_id: receiveOpenId, msg_type: 'interactive', content: JSON.stringify(card) }),
    });
    return res.json();
    // TODO: 记录发送状态、失败重试；生产环境建议用消息队列异步发送
  }

  /** 群发消息（用于Offer三方确认卡片，一次性发给多个 open_id 组成的群/多个单聊） */
  async sendCardToMultiple(receiveOpenIds: string[], card: Record<string, any>) {
    return Promise.all(receiveOpenIds.map((id) => this.sendCardMessage(id, card)));
  }

  /** 校验飞书事件回调签名，防止伪造请求。具体算法以飞书最新开放平台文档为准 */
  verifySignature(timestamp: string, nonce: string, body: string, signature: string): boolean {
    const encryptKey = this.config.get<string>('FEISHU_ENCRYPT_KEY') || '';
    const raw = `${timestamp}${nonce}${encryptKey}${body}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return hash === signature;
  }

  /** 候选人推荐卡片：含简历摘要、AI评分、"同意面试/暂不安排"按钮 */
  buildCandidateCard(resume: Resume, position: Position) {
    return {
      config: { wide_screen_mode: true },
      header: { title: { tag: 'plain_text', content: `候选人推荐：${position.title}` } },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**简历摘要**\n${resume.rawText.slice(0, 200)}...` } },
        { tag: 'hr' },
        {
          tag: 'action',
          actions: [
            { tag: 'button', text: { tag: 'plain_text', content: '同意面试' }, type: 'primary', value: { interviewId: resume.id, willingToInterview: true } },
            { tag: 'button', text: { tag: 'plain_text', content: '暂不安排' }, type: 'default', value: { interviewId: resume.id, willingToInterview: false } },
          ],
        },
      ],
      // TODO: 时间段选择建议用 selectStatic 或跳转小程序页面实现，卡片JSON需按飞书最新卡片搭建工具生成
    };
  }

  /** Offer三方确认卡片：HR/业务leader/COO 群消息，各自点击"确认" */
  buildOfferConfirmCard(candidateName: string, positionTitle: string, salary: string, offerId: string) {
    return {
      config: { wide_screen_mode: true },
      header: { title: { tag: 'plain_text', content: 'Offer确认' } },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: `**候选人**：${candidateName}\n**职位**：${positionTitle}\n**定薪**：${salary}` } },
        { tag: 'hr' },
        {
          tag: 'action',
          actions: [{ tag: 'button', text: { tag: 'plain_text', content: '确认' }, type: 'primary', value: { offerId } }],
        },
      ],
    };
  }
}
