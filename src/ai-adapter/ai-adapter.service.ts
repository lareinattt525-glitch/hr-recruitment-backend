import { Injectable } from '@nestjs/common';
import { DeepSeekProvider } from './deepseek.provider';
import { Position } from '../positions/entities/position.entity';
import { ScoringCriteria } from '../scoring/entities/scoring-criteria.entity';
import { FeedbackLog } from '../scoring/entities/feedback-log.entity';

export interface ScoreResult {
  dimensions: Record<string, number>;
  total: number;
  recommend: boolean;
  reasoning: string;
}

export interface QuestionSuggestion {
  category: string;
  questions: string[];
}

/**
 * AI能力网关：JD生成 / 简历评分 / 评分标准优化建议 / 面试问题建议 / Offer邮件草拟
 * 统一封装 Prompt 拼装逻辑，底层调用 IAIProvider（当前实现为 DeepSeekProvider）。
 * 如需接入通义千问/文心一言，新增一版 Provider 实现同一接口，在这里替换注入即可，
 * 不需要改动任何业务 Service 代码。
 */
@Injectable()
export class AiAdapterService {
  constructor(private readonly provider: DeepSeekProvider) {}

  async generateJD(position: Position): Promise<string> {
    const prompt = `你是一名资深HR，请根据以下职位信息生成一份专业的职位描述（JD），使用Markdown格式，
包含"岗位职责"（4-6条）、"任职要求"（4-6条）、"加分项"（2-3条）三部分，语言简洁专业，不要输出多余说明文字。

职位名称：${position.title}
所属部门：${position.department}
招聘人数：${position.headcount}
薪资范围：${position.salaryMin ?? '面议'}-${position.salaryMax ?? '面议'}K
需求描述：${position.requirementsRaw}`;
    return this.provider.complete(prompt);
  }

  async scoreResume(resumeText: string, jdText: string, criteria: ScoringCriteria): Promise<ScoreResult> {
    const prompt = criteria.promptTemplate.replace('{{jd}}', jdText).replace('{{resume}}', resumeText);
    const text = await this.provider.complete(prompt, { json: true });
    return JSON.parse(text);
  }

  async suggestQuestions(resumeText: string, jdText: string): Promise<QuestionSuggestion[]> {
    const prompt = `基于以下职位JD和候选人简历，生成面试问题建议，分为三类："技术深挖"、"项目经验核实"、"稳定性与离职原因确认"，
每类2-3个问题。请仅输出如下JSON数组格式，不要输出其他任何文字：
[{"category":"技术深挖","questions":["...","..."]},{"category":"项目经验核实","questions":["...","..."]},{"category":"稳定性与离职原因确认","questions":["...","..."]}]

职位JD：
${jdText}

候选人简历：
${resumeText}`;
    const text = await this.provider.complete(prompt, { json: true });
    return JSON.parse(text);
  }

  /** 评分反馈闭环：分析近期"不准确"案例，给出维度权重/prompt表述的调整建议（草稿，需HR确认后启用） */
  async suggestCriteriaOptimization(
    currentCriteria: ScoringCriteria,
    badCases: FeedbackLog[],
  ): Promise<{ dimensions?: Record<string, number>; promptTemplate?: string; explanation: string }> {
    const casesText = badCases
      .map((c, i) => `案例${i + 1}：HR认为正确判断是"${c.correctJudgement}"，原因："${c.feedbackReason}"`)
      .join('\n');
    const prompt = `当前评分维度权重：${JSON.stringify(currentCriteria.dimensions)}
以下是HR标记"评分不准确"的历史案例：
${casesText || '（暂无案例）'}

请分析这些案例反映出的共性问题，并给出新的维度权重建议（JSON对象，key为维度名，value为0-1之间的权重，总和为1）。
请仅输出如下JSON，不要输出其他任何文字：
{"dimensions": {...}, "explanation": "不超过150字的调整说明"}`;
    const text = await this.provider.complete(prompt, { json: true });
    return JSON.parse(text);
  }

  async draftOfferEmail(candidateName: string, positionTitle: string, salary: string): Promise<string> {
    const prompt = `请你以公司HR的身份，给候选人写一封offer邮件。候选人姓名：${candidateName}，录用职位：${positionTitle}，薪资：${salary}。
语气正式、热情、专业，包含欢迎加入、职位与薪资确认、入职时间待沟通、联系人信息（HR）等内容。
直接输出邮件正文（含称呼与落款"公司 HR团队"），不要输出多余说明或代码块标记。`;
    return this.provider.complete(prompt);
  }
}
