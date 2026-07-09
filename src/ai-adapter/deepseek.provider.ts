import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider } from './ai-provider.interface';

@Injectable()
export class DeepSeekProvider implements IAIProvider {
  constructor(private readonly config: ConfigService) {}

  async complete(prompt: string, options?: { json?: boolean }): Promise<string> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 中设置');

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        // DeepSeek 支持 OpenAI 兼容的 JSON 输出模式，要求评分/问题建议等结构化场景稳定输出JSON
        ...(options?.json ? { response_format: { type: 'json_object' } } : {}),
      }),
      // TODO: 生产环境建议加超时控制（AbortController）、失败重试、以及按调用场景记录token用量
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek调用失败: ${res.status} ${errText}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}
