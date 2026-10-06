// 成员姓名与方向沿用现站示例；部门、简介、寄语为占位
export const MEMBERS = [
  { name: '林沛然', pinyin: 'Lin Peiran', tag: '显微摄影', dept: '宣传部' },
  { name: '苏晚晴', pinyin: 'Su Wanqing', tag: '生态调查', dept: '学术实践部' },
  { name: '叶蓁蓁', pinyin: 'Ye Zhenzhen', tag: '档案管理', dept: '秘书部' },
  { name: '陈屿舟', pinyin: 'Chen Yuzhou', tag: '文献分享', dept: '学术实践部' },
  { name: '何田田', pinyin: 'He Tiantian', tag: '视觉设计', dept: '宣传部' },
  { name: '高蕴哲', pinyin: 'Gao Yunzhe', tag: '校园讲解', dept: '活动服务部' },
].map((m) => ({
  ...m,
  bio: '成员简介占位：所在学院与专业、在协会负责的事情、最近在钻研的方向。',
  quote: '寄语占位：一句想对后来者说的话。',
}));

// 会员名录：前 6 位沿用现站示例，其余为程序生成的演示占位（用于验证上百人时的展示效果），接入后台后替换
const XING = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何林罗郑梁谢宋唐许韩冯邓曹彭曾萧田董潘袁蔡蒋余于杜叶程魏苏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方邹熊白孟秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤';
const MING = ['子涵', '欣怡', '浩然', '诗涵', '宇轩', '梓萱', '若曦', '一诺', '思远', '雨桐', '俊熙', '可馨', '明哲', '语嫣', '书瑶', '天佑', '清妍', '景行', '知夏', '星澜', '沐晨', '安然', '亦舟', '芷若', '嘉禾', '予安', '云帆', '晚晴', '时雨', '思齐'];
const COLLEGES = ['生物科学与工程学院', '农学院', '动物科学技术学院', '林学院', '园林与艺术学院', '计算机与信息工程学院', '食品科学与工程学院', '国土资源与环境学院'];
const DEPTS = ['秘书部', '宣传部', '学术实践部', '活动服务部'];
const TAGS = ['显微摄影', '生态调查', '文献分享', '视觉设计', '校园讲解', '数据挖掘', 'AI 创作', '标本制作', '科普写作', '植物识别', '观鸟', '实验技能'];

export const ROSTER = [
  ...MEMBERS.map((m, i) => ({ ...m, id: `m${i}`, college: COLLEGES[i % COLLEGES.length], year: '2025 级' })),
  ...Array.from({ length: 118 }, (_, i) => {
    const k = i * 7 + 3;
    return {
      id: `p${i}`,
      name: XING[k % XING.length] + MING[(k * 3) % MING.length],
      pinyin: '',
      tag: TAGS[k % TAGS.length],
      dept: DEPTS[k % DEPTS.length],
      college: COLLEGES[(k * 5) % COLLEGES.length],
      year: `${2023 + (k % 3)} 级`,
      bio: '成员简介占位。',
      quote: '寄语占位。',
      demo: true,
    };
  }),
];
export const ROSTER_DEPTS = DEPTS;

// 校园墙：前 7 条为现站真实图注（照片待接入），其余为占位
export const WALL = [
  { kind: '活动', caption: '生物启扉协会第一次全体（扩大）会议合影', date: '2025.10', ratio: 0.66 },
  { kind: '活动', caption: '第一届「黑客松」AI 创作大赛颁奖合影', date: '2025.11', ratio: 0.75 },
  { kind: '活动', caption: '黑客松现场 · 聆听分享', date: '2025.11', ratio: 1.25 },
  { kind: '活动', caption: '黑客松现场 · 代码创作', date: '2025.11', ratio: 0.8 },
  { kind: '活动', caption: '公益科普课堂 · 与孩子们合影', date: '2025.12', ratio: 0.7 },
  { kind: '校园', caption: '白昼的校园广场 · 升旗仪式', date: '2025.10', ratio: 1.3 },
  { kind: '校园', caption: '校园星轨夜景', date: '2025.11', ratio: 1.1 },
  { kind: '观察', caption: '校园观察记录 · 待补充', date: '待定', ratio: 0.9 },
  { kind: '观察', caption: '校园观察记录 · 待补充', date: '待定', ratio: 1.4 },
  { kind: '观察', caption: '校园观察记录 · 待补充', date: '待定', ratio: 0.75 },
];
