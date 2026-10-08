// 旧 Payload 后端的 /api/public-articles → 本地 NEWS 数据结构 的适配层
import { getJSON } from './http.js';

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
