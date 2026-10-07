// 部门 / 工作室 / 项目 / 活动：真实文案；标注「示例」「待公布」处为占位
export const DEPARTMENTS = [
  { name: '秘书部', en: 'Secretariat', text: '负责协会文件起草、会议组织、档案与物资管理、值班安排及人员考勤等日常行政事务。' },
  { name: '宣传部', en: 'Media', text: '负责协会新媒体平台运营、宣传物料设计、活动采编记录及品牌形象建设与推广。' },
  { name: '学术实践部', en: 'Academic', text: '负责组织专业知识与实践技能培训，开展生命科学及相关交叉领域的学习实践，并为会员提供科研与专业学习指导。' },
  { name: '活动服务部', en: 'Events', text: '负责协会常规活动和品牌活动的策划实施、场地物料及人员统筹，并做好活动复盘与优化。' },
];

export const COUNCIL = [
  { title: '会长', name: '待公布' },
  { title: '副会长', name: '待公布' },
  { title: '副会长', name: '待公布' },
  { title: '秘书长', name: '待公布' },
  { title: '指导老师', name: '待公布' },
];

export const STUDIOS = [
  {
    key: 'shengsheng',
    name: '生生不息',
    en: 'Endless Life',
    text: '一句提示词，一帧好画面。我们用 AI 生成视频与图片，把天马行空的想象，做成看得见、摸得着的作品。',
    tags: ['AI 视频生成', 'AI 图片生成', '提示词创作'],
  },
  {
    key: 'dataseek',
    name: 'DATASEEK',
    en: 'Data Seek',
    text: '从网页到数据集：写爬虫、挖数据、做整理，把散落各处的信息收拢成干净的数据，再从中读出故事。',
    tags: ['数据挖掘', '数据提取', '爬虫', '数据整理'],
  },
];

// stage: 0 立项孵化 / 1 开发进行时 / 2 成果发布
export const STAGES = [
  { name: '立项孵化', en: 'Incubating', angle: 12 },
  { name: '开发进行时', en: 'Building', angle: 38 },
  { name: '成果发布', en: 'Released', angle: 70 },
];

export const PROJECTS = [
  { stage: 0, status: '孵化中', title: '校园物种数据图谱', text: '把自然观察节积累的照片与记录结构化，给校园里的动植物建一份可检索的数据档案。' },
  { stage: 1, status: '进行中', title: 'AI 节气海报流水线', text: '提示词模板 + 批量生成 + 人工精选，让每个节气都有一张协会专属海报。' },
  { stage: 1, status: '进行中', title: '竞赛数据集工具箱', text: '把常用爬虫脚本和数据清洗流程封装成开箱即用的工具包，降低参赛门槛。' },
  { stage: 2, status: '已发布', title: '黑客松 AI 创作大赛作品集', text: '第一届「黑客松」AI 创作大赛的全部入围作品整理成册，线上展映中。' },
];

export const EVENTS = [
  {
    term: '2025 秋',
    items: [
      { status: '已举办', title: '第一次全体（扩大）会议', text: '协会扬帆第一站：章程发布、部门亮相、新成员破冰，启扉大家庭第一次全员到齐。' },
      { status: '已举办', title: '第六届科技文化节 · 第一届「黑客松」AI 创作大赛', text: 'TRAE on Campus @ 江西农业大学——48 小时极限创作，用 AI 把点子做成作品。' },
    ],
  },
  {
    term: '2026 春',
    items: [
      { status: '待定', title: '校园自然观察日', text: '带上放大镜和好奇心，走遍校园认植物、观飞鸟、读生态。' },
      { status: '待定', title: '科普进课堂', text: '把有趣的科学带出校园，给中小学生们上一堂不一样的自然课。' },
    ],
  },
];

export const RECRUIT = [
  '招募对象：江西农业大学全日制在校学生',
  '专业与年级不限，从热爱出发',
  '集中招新时间以协会正式通知为准',
];
