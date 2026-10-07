// 每个公开资源一个函数;返回契约里的 data
// 参考 docs/api/web-data-access.md §3.2
import { request } from './http.js';

const enc = encodeURIComponent;

export const getSite = (o) => request('/api/public/site', o).then((r) => r.data?.[0] ?? null);
export const listDepartments = (o) => request('/api/public/departments', o).then((r) => r.data ?? []);
export const listCouncil = (o) => request('/api/public/council-members', o).then((r) => r.data ?? []);
export const listStudios = (o) => request('/api/public/studios', o).then((r) => r.data ?? []);
export const getStudio = (slug, o) => request(`/api/public/studios?slug=${enc(slug)}`, o).then((r) => r.data?.[0] ?? null);
export const listEvents = (o) => request('/api/public/events', o).then((r) => r.data ?? []);
export const listProjects = (o) => request('/api/public/projects', o).then((r) => r.data ?? []);
export const listMembers = (o) => request('/api/public/members', o).then((r) => r.data ?? []);
export const listFeaturedMembers = (o) => request('/api/public/members?featured=true', o).then((r) => r.data ?? []);
export const listWall = (o) => request('/api/public/wall', o).then((r) => r.data ?? []);
export const listNotes = (o) => request('/api/public/notes', o).then((r) => r.data ?? []);
export const getNote = (slug, o) => request(`/api/public/notes?slug=${enc(slug)}`, o).then((r) => r.data?.[0] ?? null);

// 既有契约;把文章归一化成页面用的视图形状
// id = slug(路由 /news/:id 用);pid = 内部数字 id(article-view 用)
const toNews = (a) => ({
  id: a.slug,
  pid: a.id,
  cat: (a.category ?? []).map((c) => c.name).join(' · ') || '未分类',
  cats: (a.category ?? []).map((c) => c.name),
  date: String(a.published_at || a.date_created || '').slice(0, 10),
  title: a.title,
  excerpt: a.summary ?? '',
  content: a.content ?? '',
  cover: a.cover ?? null,
  source: a.source,
  views: a.views ?? 0,
});

export const listArticles = (o) => request('/api/public-articles', o).then((r) => (r.data ?? []).map(toNews));
export const getArticle = (slug, o) =>
  request(`/api/public-articles?slug=${enc(slug)}`, o).then((r) => (r.data?.[0] ? toNews(r.data[0]) : null));
export const postArticleView = (id, o) =>
  request(`/api/article-view/${enc(id)}`, { ...o, method: 'POST' }).then((r) => r.raw?.views ?? null);

export const submitJoin = (payload, o) =>
  request('/api/public/join-applications', { ...o, method: 'POST', body: payload }).then((r) => r.data);
