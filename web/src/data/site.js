// 站点级真实信息（来自现站文案）
export const ORG = {
  school: '江西农业大学',
  name: '生物启扉协会',
  en: 'BioQif Association',
  slogan: '启迪生命 · 扉向未来',
  sloganEn: 'Enlightenment · Innovation · Future',
  motto: '一粒因热爱播种的种子，在江农的土壤里生根发芽。',
  address: '江西省南昌市经济技术开发区志敏大道 1101 号',
  mailCoop: 'contact@bioqif.com',
  mailOffice: 'office@bioqif.com',
};

// 十个栏目；no 用作编号
export const SECTIONS = [
  { no: '01', to: '/about', title: '协会概况', en: 'About', desc: '简介、章程与发展历程' },
  { no: '02', to: '/org', title: '组织机构', en: 'Structure', desc: '理事会、部门与工作室' },
  { no: '03', to: '/news', title: '启扉快讯', en: 'News', desc: '每一次探索与成长' },
  { no: '04', to: '/science', title: '学术科创', en: 'Research', desc: '从立项到成果发布' },
  { no: '05', to: '/events', title: '品牌活动', en: 'Events', desc: '一场场落地的种子' },
  { no: '06', to: '/members', title: '会员风采', en: 'Members', desc: '每一份好奇都被看见' },
  { no: '07', to: '/wall', title: '校园墙', en: 'Wall', desc: '校园观察与活动影像' },
  { no: '08', to: '/popular', title: '知识普及', en: 'Notes', desc: '人人可读的学习笔记' },
  { no: '09', to: '/studios', title: '特色工作室', en: 'Studios', desc: '把兴趣做成作品' },
  { no: '10', to: '/join', title: '加入我们', en: 'Join', desc: '成为同路人' },
];

export function sectionOf(pathname) {
  return SECTIONS.find((d) => pathname === d.to || pathname.startsWith(d.to + '/'));
}

// pillars/milestones/recruitmentRules 已迁移至 SiteSettings global(/api/public/site)
export const PILLARS = [];
export const MILESTONES = [];
