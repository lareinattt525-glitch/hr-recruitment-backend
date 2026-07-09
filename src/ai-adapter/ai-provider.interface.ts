// 统一AI Provider接口 —— 每个大模型实现一版，业务代码只依赖这个接口，
// 后续切换/横向对比 通义千问/文心一言/其他 模型时，业务代码无需改动。
export interface IAIProvider {
  complete(prompt: string, options?: { json?: boolean }): Promise<string>;
}
