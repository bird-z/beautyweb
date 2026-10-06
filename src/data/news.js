// 新闻：标题取自现站真实活动；日期、来源、浏览量、正文为占位，接入 CMS 后替换
export const NEWS_CATS = ['学术', '科创', '活动', '实践', '志愿', '科普'];

const BODY = [
  '此处为新闻正文占位文字。接入 CMS 后，这里会展示完整的活动报道、图片与引述。',
  '正文第二段占位：介绍活动背景、参与人员与过程中的亮点时刻，篇幅建议在三到六段之间。',
  '正文第三段占位：总结收获与后续计划，并附上相关链接或报名入口。',
];

export const NEWS = [
  { id: 'first-assembly', cat: '活动', date: '2025-10-12', title: '协会扬帆：第一次全体（扩大）会议召开', excerpt: '章程发布、部门亮相、新成员破冰，启扉大家庭第一次全员到齐。' },
  { id: 'hackathon-1', cat: '科创', date: '2025-11-23', title: '第一届「黑客松」AI 创作大赛圆满落幕', excerpt: 'TRAE on Campus @ 江西农业大学，48 小时极限创作，用 AI 把点子做成作品。' },
  { id: 'hackathon-works', cat: '科创', date: '2025-12-02', title: '黑客松 AI 创作大赛作品集线上展映', excerpt: '全部入围作品整理成册，欢迎线上观看。' },
  { id: 'outreach-class', cat: '科普', date: '2025-12-14', title: '公益科普课堂：和孩子们一起认识生命', excerpt: '把有趣的科学带出校园，给中小学生们上一堂不一样的自然课。' },
  { id: 'lecture-placeholder', cat: '学术', date: '2026-03-08', title: '学术讲座标题占位', excerpt: '摘要占位：一句话说明讲座主题与主讲人。' },
  { id: 'nature-day', cat: '实践', date: '2026-04-01', title: '校园自然观察日报名开启', excerpt: '带上放大镜和好奇心，走遍校园认植物、观飞鸟、读生态。' },
  { id: 'volunteer-placeholder', cat: '志愿', date: '2026-04-18', title: '志愿活动标题占位', excerpt: '摘要占位：志愿服务的时间、地点与内容。' },
].map((n, i) => ({
  ...n,
  source: '生物启扉协会宣传部',
  views: 0,
  body: BODY,
  seq: i + 1,
})).sort((a, b) => b.date.localeCompare(a.date));
