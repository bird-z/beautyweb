// 旧 Payload 后端的 /api/public-articles → 本地数据结构的适配层
import { getJSON } from './http.js';

// ---- 新闻文章（News 页用）----

// 后端 category 是 [{name, slug}] 数组；前端 NEWS_CATS 是中文名数组
// name 直接就是中文分类名（如 "活动"），取第一个作为单选 cat
function adaptArticle(a) {
  return {
    id: a.slug || String(a.id),          // 前端路由用 id，slug 更可读
    cat: a.category?.[0]?.name || '未分类',
    date: (a.published_at || a.date_created || '').slice(0, 10),
    title: a.title || '',
    excerpt: a.summary || '',
    source: a.source || a.author || '生物启扉协会',
    views: a.views ?? 0,
    // body 是 HTML 字符串数组（保持与 src/data/news.js 的 body: string[] 一致形状，
    // 但单个字符串内含 HTML，渲染时由调用方决定 innerHTML 还是分段）
    body: a.content ? [a.content] : [],
    cover: a.cover || null,
    featured: !!a.featured,
    // 保留原始字段备查
    _raw: a,
  };
}

/**
 * 拉取全部已发布文章
 * @returns {Promise<Array>} 适配后的文章数组，按 published_at 倒序
 */
export async function fetchArticles(opts) {
  const { data } = await getJSON('/api/public-articles', opts);
  return (data || []).map(adaptArticle).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 按 slug 拉单篇（后端本身支持 ?slug= 精确查）
 */
export async function fetchArticleBySlug(slug, opts) {
  const { data } = await getJSON('/api/public-articles', { ...opts, params: { slug } });
  const a = (data || [])[0];
  return a ? adaptArticle(a) : null;
}

// ---- 会员档案（Members 页用）：把"会员"分类的文章当会员数据 ----

// 文章 schema 没有会员档案字段，约定挪用以下冗余字段承载。
// 将来后端有真正的 members collection 时只需改这里。
export const MEMBER_FIELDS = {
  dept: 'author',     // 作者   → 部门
  college: 'source',  // 来源   → 学院·年级（一格写全，如"生物科学与工程学院·2025级"）
  tag: 'editor',      // 编辑   → 兴趣方向
};

function htmlToText(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function adaptMember(a) {
  return {
    id: `remote-${a.slug || a.id}`,      // 前缀避免与本地 m0-p117 冲突
    name: a.title || '',
    dept: a[MEMBER_FIELDS.dept] || '',
    college: a[MEMBER_FIELDS.college] || '',
    tag: a[MEMBER_FIELDS.tag] || '',
    year: '',                            // college 已含年级
    bio: a.summary || '',
    quote: htmlToText(a.content),
    cover: a.cover || null,
    remote: true,                        // 标记远程来源
    _raw: a,
  };
}

/**
 * 拉取"会员"分类下的文章，适配为会员档案数组
 * @returns {Promise<Array>}
 */
export async function fetchMemberArticles(opts) {
  const { data } = await getJSON('/api/public-articles', opts);
  return (data || [])
    .filter((a) => (a.category || []).some((c) => c.slug === 'members'))
    .map(adaptMember);
}
