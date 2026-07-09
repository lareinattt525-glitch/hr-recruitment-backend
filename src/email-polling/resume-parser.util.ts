// 简历附件解析占位工具。生产实现建议：
// 1. PDF: pdf-parse 或调用AI能力网关做"非结构化->结构化"提取
// 2. Word(.doc/.docx): mammoth 提取纯文本
// 3. 提取后的纯文本传给 AiAdapterService 做结构化解析（教育经历/工作经历/技能等）
export async function extractTextFromAttachment(filename: string, buffer: Buffer): Promise<string> {
  // TODO: 按文件后缀分发到不同解析器
  throw new Error(`附件解析尚未实现: ${filename}`);
}
