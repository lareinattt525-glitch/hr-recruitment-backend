# HR招聘系统 · 后端脚手架

基于 NestJS + TypeORM + PostgreSQL，按《HR招聘系统技术方案设计》的模块划分实现。这是一个**结构完整、可本地跑起来的脚手架**——核心业务状态机（职位→简历→评分→面试→Offer三方确认）已实现，飞书 / DeepSeek / 腾讯企业邮箱这几个需要你自己密钥的真实对接点，代码里都留了清晰的位置和注释。

## 目录结构

```
src/
├── positions/          职位 + JD生成
├── candidates/         候选人
├── resumes/            简历（应聘记录，含pipeline阶段 stage）
├── scoring/            评分标准（版本化）+ 评分记录 + HR反馈闭环
├── interviews/         HR面试 / 业务面试各轮次 + 面试官响应
├── offers/             Offer + 三方确认（HR/业务leader/COO）
├── ai-adapter/         AI能力网关，统一封装 DeepSeek 调用（可插拔替换其他模型）
├── feishu-integration/ 飞书消息卡片发送、签名校验
├── email-polling/      简历邮箱轮询（腾讯企业邮箱 IMAP，定时任务骨架）
├── operation-logs/     操作审计日志
└── common/enums/       全局状态枚举
```

## 本地启动

```bash
npm install
cp .env.example .env    # 按需填入真实密钥
docker compose up -d    # 启动本地PostgreSQL
npm run start:dev
```

默认 `synchronize: true`（`src/config/typeorm.config.ts`），首次启动会自动建表，方便脚手架阶段快速起步。**进入正式开发后应关闭 synchronize，改用 TypeORM migration 管理表结构**（`npm run migration:generate` / `npm run migration:run`）。

## 三个真实对接点（当前是占位/未接入真实凭证）

| 模块 | 文件 | 需要你做的事 |
|---|---|---|
| AI（DeepSeek） | `src/ai-adapter/deepseek.provider.ts` | 在 `.env` 填 `DEEPSEEK_API_KEY` 即可直接跑通，无需改代码 |
| 飞书 | `src/feishu-integration/feishu.service.ts` | 在飞书开放平台创建自建应用，填 `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_ENCRYPT_KEY`；卡片JSON建议用飞书官方"卡片搭建工具"重新生成后替换 `buildCandidateCard` / `buildOfferConfirmCard` 里的结构 |
| 腾讯企业邮箱 | `src/email-polling/email-polling.service.ts` | 安装并接入 `imapflow` + `mailparser`（已在package.json中声明依赖），按文件内注释补全IMAP连接与邮件解析逻辑；`.env` 中填 `RESUME_INBOX_USER` / `RESUME_INBOX_APP_PASSWORD`（腾讯企业邮箱后台生成的"客户端专用密码"，不要用登录密码） |

其余功能（职位/JD、简历评分、反馈闭环、面试流转、Offer三方确认）都是可直接调用的真实业务逻辑，不依赖上述三个外部凭证也能跑通（AI相关接口会在没有 `DEEPSEEK_API_KEY` 时报错，属预期行为）。

## 登录权限

现在所有接口默认都需要登录（JWT），未登录会返回 `401`。角色分四种：`admin`（管理员）、`hr`、`dept`（用人部门）、`interviewer`（业务面试官）。管理员不受角色限制，永远放行。

权限划分（对应技术方案文档"安全与权限设计"一节）：

| 操作 | 允许角色 |
|---|---|
| 创建职位 | HR、用人部门 |
| 生成/发布JD | 仅HR |
| 简历入库、评分、面试、Offer相关全部接口 | 仅HR |
| 登记面试结果、查看分配给自己的面试 | HR、业务面试官 |
| 飞书webhook回调（卡片交互、Offer确认） | 不登录，用签名校验（`FeishuService.verifySignature`，目前是TODO占位，接入真实飞书应用后需要补上校验调用） |

### 第一次使用：创建管理员账号

出于安全考虑，**没有开放公开注册接口**——不能让任何人访问网站就自己注册出一个管理员账号。第一个管理员用命令行脚本创建：

```bash
npm run create-admin -- --email=你的邮箱 --password=至少8位密码 --name="你的名字"
```

用这个账号登录后，调用 `POST /users`（管理员专属）给HR、用人部门、业务面试官创建账号：

```bash
# 1. 登录拿到 token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"你的邮箱","password":"你的密码"}'
# 返回 { "accessToken": "...", "user": {...} }

# 2. 用 accessToken 创建一个HR账号
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <上一步拿到的accessToken>" \
  -d '{"email":"hr@yourcompany.com","password":"至少8位密码","name":"HR的名字","role":"hr"}'
```

之后HR、用人部门、业务面试官各自用自己的邮箱密码登录 `POST /auth/login`，请求其他接口时都在Header里带上 `Authorization: Bearer <accessToken>`。

### 已知限制（当前版本没做，后续可以再加）

- 目前是"接口级别"权限（谁能调哪个接口），还没做"数据级别"权限——比如用人部门理论上应该只看到自己发起的职位，现在是能看到全部职位列表（只是创建/发布JD这类操作被角色挡住了）。这个后续可以在 Service 层按 `requesterId` 过滤补上。
- 飞书webhook的签名校验代码已经写好（`FeishuService.verifySignature`），但controller里还没有真正调用它做拦截——因为需要真实的飞书应用凭证才能测试，先留了TODO标注，接入真实飞书应用时记得补上，否则这两个回调接口任何人都能伪造请求调用。
- 没有做"忘记密码"、账号禁用/删除、登录失败次数限制这些运营向功能。

## 核心接口速查（详见各 controller）

- `POST /positions` 创建职位 → `POST /positions/:id/generate-jd` AI生成JD → `PUT /positions/:id/jd` 发布
- `POST /internal/resumes/ingest` 简历入库（自动触发AI评分）
- `POST /score-records/:id/feedback` HR反馈 → `POST /scoring-criteria/:positionId/optimize` 生成优化建议 → `PUT /scoring-criteria/:id/activate` 确认启用
- `POST /resumes/:resumeId/hr-interview` 安排HR面试 → `GET /interviews/:id/question-suggestions` AI问题建议 → `PUT /interviews/:id/result` 登记结果
- `POST /interviews/:id/push-to-business` 推送业务面试官 → `POST /webhooks/feishu/card-callback` 面试官响应回调
- `POST /offers` 创建offer（自动群发三方确认卡片）→ `POST /webhooks/feishu/offer-confirm-callback` 确认回调 → `POST /offers/:id/generate-email` → `POST /offers/:id/send`

## 尚未包含（脚手架范围之外，需后续补充）

- 对象存储上传简历文件的具体实现（`fileUrl` 字段目前由调用方提供）
- 单元测试
- 生产级错误处理、限流、日志采集
- "忘记密码"、账号禁用、登录失败限制等账号运营功能
- 数据级别的权限过滤（见上方"登录权限"一节的"已知限制"）
