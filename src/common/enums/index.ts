export enum JdStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum PositionStatus {
  OPEN = 'open',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export enum CandidateSource {
  EMAIL = 'email',
  REFERRAL = 'referral',
  HEADHUNTER = 'headhunter',
  OTHER = 'other',
}

// 候选人在某个职位上的应聘流转阶段（挂在 Resume 上，因为同一候选人可能应聘多个职位）
export enum CandidateStage {
  NEW = 'new',
  HR_INTERVIEW = 'hr_interview',
  BUSINESS_PENDING = 'business_pending',
  BUSINESS_1ST = 'business_1st',
  BUSINESS_2ND = 'business_2nd',
  FINAL = 'final',
  OFFER = 'offer',
  DONE = 'done',
}

export enum CandidateOutcome {
  REJECTED = 'rejected',
  OFFER_SENT = 'offer_sent',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
}

export enum CriteriaSource {
  SYSTEM = 'system',
  HR_FEEDBACK_OPTIMIZED = 'hr_feedback_optimized',
}

export enum InterviewRoundType {
  HR = 'hr',
  BUSINESS_1ST = 'business_1st',
  BUSINESS_2ND = 'business_2nd',
  FINAL = 'final',
}

export enum InterviewStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
}

export enum InterviewResult {
  PASS = 'pass',
  FAIL = 'fail',
}

export enum OfferStatus {
  DRAFT = 'draft',
  PENDING_CONFIRM = 'pending_confirm',
  CONFIRMED = 'confirmed',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum ConfirmerRole {
  HR = 'hr',
  BUSINESS_LEADER = 'business_leader',
  COO = 'coo',
}

// 网页端登录账号角色。注意：业务leader/COO 不在此列——他们只通过飞书群消息卡片点击"确认"，
// 不需要网页登录（对应 offers 模块的 ConfirmerRole，是两套独立的身份体系）。
export enum UserRole {
  ADMIN = 'admin',         // 系统管理员：可创建账号、启用新版评分标准
  HR = 'hr',                // HR：全流程操作权限
  DEPT = 'dept',             // 用人部门：仅可提交职位需求、查看自己职位的候选人进展
  INTERVIEWER = 'interviewer', // 业务面试官：查看/响应被推送给自己的候选人
}
