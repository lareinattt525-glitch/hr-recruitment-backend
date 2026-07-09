// 默认评分prompt模板，{{jd}} / {{resume}} 会被实际内容替换
export const DEFAULT_SCORING_PROMPT = `你是一名资深招聘官。请基于以下职位JD和候选人简历，从五个维度评估匹配度：
技能匹配度、经验匹配度、教育背景匹配度、稳定性、行业相关度，每个维度打分0-100。
同时给出总分total(0-100)、是否建议安排面试recommend(true/false)、一段不超过80字的评估理由reasoning。
请仅输出如下JSON，不要输出其他任何文字或代码块标记：
{"dimensions":{"技能匹配度":0,"经验匹配度":0,"教育背景匹配度":0,"稳定性":0,"行业相关度":0},"total":0,"recommend":true,"reasoning":"..."}

职位JD：
{{jd}}

候选人简历：
{{resume}}`;
