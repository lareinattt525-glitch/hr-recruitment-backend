import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { FeishuService } from '../feishu-integration/feishu.service';
import { InterviewsService } from '../interviews/interviews.service';
import { OffersService } from '../offers/offers.service';

/**
 * 真正的飞书回调入口——Feishu 只允许配置一个"请求网址"，事件和卡片交互都会打到这里，
 * 靠 payload 形状/自定义 value.kind 字段在内部分发。
 *
 * 与 interviews.controller.ts / offers.controller.ts 里那两个 @Public() 的
 * /webhooks/feishu/card-callback、/webhooks/feishu/offer-confirm-callback 是两回事：
 * 那两个是给我们自己的前端"模拟飞书"用的（干净的自定义JSON），不要删掉，前端还在用。
 * 这里这个才是真实飞书服务器会调用的地址，负责把飞书的原始回调格式"翻译"成前端调用的
 * 同一套 DTO，然后复用同一套业务逻辑（InterviewsService / OffersService），避免逻辑重复。
 */
@Controller('webhooks/feishu')
export class FeishuWebhookController {
  private readonly logger = new Logger(FeishuWebhookController.name);

  constructor(
    private readonly feishu: FeishuService,
    private readonly interviewsService: InterviewsService,
    private readonly offersService: OffersService,
  ) {}

  @Public()
  @Post('callback')
  async handleCallback(@Body() body: any, @Headers() headers: Record<string, string>) {
    // 1. URL校验握手：第一次在飞书后台保存"请求网址"时，飞书会先发这种请求确认地址有效
    if (body?.type === 'url_verification' && body?.challenge) {
      this.logger.log('收到飞书URL校验请求');
      return { challenge: body.challenge };
    }

    // 2. 如果配置了 Encrypt Key，尝试做签名校验（仅记录结果，暂不作为拒绝依据——
    //    因为NestJS默认已把请求体解析成对象，要做到与飞书计算时完全一致的原始字节比较，
    //    需要额外接入"保留原始请求体"的中间件，这是后续可以补充的强化项，见README）
    const encryptKey = process.env.FEISHU_ENCRYPT_KEY;
    if (encryptKey) {
      const ok = this.feishu.verifySignature(
        headers['x-lark-request-timestamp'],
        headers['x-lark-request-nonce'],
        JSON.stringify(body),
        headers['x-lark-signature'],
      );
      this.logger.log(`签名校验结果（仅记录，未拦截）：${ok}`);
    }

    // 3. 真正的业务分发：从飞书的原始回调结构里提取"谁点的"和"点了什么"
    //    结构如有出入（飞书接口偶有调整），Railway日志里能看到完整原始body，方便对照文档调整。
    this.logger.log('收到飞书回调，原始内容：' + JSON.stringify(body));

    const operatorOpenId = body?.operator?.open_id || body?.event?.operator?.open_id;
    const rawValue = body?.action?.value || body?.event?.action?.value;
    const value = typeof rawValue === 'string' ? this.safeParse(rawValue) : rawValue;

    if (!value?.kind) {
      this.logger.warn('回调里没有识别到 value.kind，忽略（可能是尚未支持的回调类型）');
      return {};
    }

    try {
      if (value.kind === 'interview_response') {
        await this.interviewsService.recordInterviewerResponse({
          interviewId: value.interviewId,
          interviewerId: operatorOpenId,
          willingToInterview: !!value.willingToInterview,
          availableSlots: value.availableSlots || [],
        });
      } else if (value.kind === 'offer_confirm') {
        await this.offersService.handleConfirmCallback(value.offerId, operatorOpenId);
      }
    } catch (e) {
      this.logger.error('处理飞书回调时业务逻辑报错：' + e.message);
      // 即使业务处理失败，也要在3秒内正常返回，避免飞书端提示"请求错误"并触发重试风暴
    }

    // 飞书要求3秒内返回；不更新卡片内容时，body需要是字符串 "{}"
    return {};
  }

  private safeParse(text: string) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }
}
