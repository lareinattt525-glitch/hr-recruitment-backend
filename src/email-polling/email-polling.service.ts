import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ResumesService } from '../resumes/resumes.service';

/**
 * 简历邮箱轮询服务（腾讯企业邮箱，IMAP）。
 * 脚手架阶段先给出定时任务骨架与接入参数位置，真实IMAP连接与邮件解析逻辑需要补充：
 *
 *   import { ImapFlow } from 'imapflow';
 *   const client = new ImapFlow({
 *     host: this.config.get('RESUME_INBOX_HOST'),   // imap.exmail.qq.com
 *     port: Number(this.config.get('RESUME_INBOX_PORT')), // 993
 *     secure: true,
 *     auth: {
 *       user: this.config.get('RESUME_INBOX_USER'),
 *       pass: this.config.get('RESUME_INBOX_APP_PASSWORD'), // 腾讯企业邮箱"客户端专用密码"
 *     },
 *   });
 *   await client.connect();
 *   const lock = await client.getMailboxLock('INBOX');
 *   try {
 *     for await (const msg of client.fetch({ seen: false }, { source: true })) {
 *       const parsed = await simpleParser(msg.source); // mailparser
 *       // 1. 提取附件 -> 上传对象存储 -> 得到 fileUrl
 *       // 2. 提取附件文本 -> resume-parser.util.ts
 *       // 3. 调用 this.resumesService.ingest({ candidateName, candidateEmail, fileUrl, rawText, ... })
 *       // 4. 标记邮件已读，避免重复处理
 *     }
 *   } finally {
 *     lock.release();
 *   }
 *   await client.logout();
 */
@Injectable()
export class EmailPollingService {
  private readonly logger = new Logger(EmailPollingService.name);

  constructor(private readonly config: ConfigService, private readonly resumesService: ResumesService) {}

  @Cron('*/5 * * * *') // 每5分钟轮询一次
  async pollInbox() {
    const user = this.config.get('RESUME_INBOX_USER');
    if (!user) {
      this.logger.warn('RESUME_INBOX_USER 未配置，跳过本次轮询');
      return;
    }
    // TODO: 接入真实 imapflow 逻辑（见上方注释），当前为脚手架占位
    this.logger.log('邮件轮询任务执行（脚手架占位，尚未接入真实IMAP连接）');
  }
}
