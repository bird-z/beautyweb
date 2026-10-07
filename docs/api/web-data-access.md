# `web/` 前端数据访问与状态约定

本文档回答 Issue #7:前端怎么消费 `docs/api/public-rest-api.md` 定义的公开 API、状态怎么分层、`data/*.js` 如何退役。目标是**保留现有路由与视觉**,只换数据来源。

状态:草案 v1。

## 1. 总原则

- **契约即真相**:前端只认 `public-rest-api.md` 里的包络、字段、空语义;不允许"看着响应再适配"。
- **一处取数**:所有 `fetch` 只能出现在 `web/src/services/` 下;页面组件不允许直接 `fetch`。
- **保留视觉与路由**:`App.jsx` 的 `Routes`、URL 参数名(`?cat=`、`?dept=`)、`/:id` 详情段不变;`data/*.js` 只是改成"默认空数组/占位骨架"的来源,不删除文件、不改导出签名,避免连锁改样式。
- **失败可恢复**:任何公开读端点失败,页面显示"加载失败/重试"而不是白屏;详情未命中显示 `NotFound`。

## 2. 环境变量

| 变量 | 位置 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE` | `web/.env.local`(不提交)、`web/.env.production`(可提交) | 后端 base,例 `http://localhost:3000` / `https://cms.bioqif.com` |
| `VITE_API_TIMEOUT_MS` | 可选 | 默认 `8000` |

代码里读取:`const API_BASE = import.meta.env.VITE_API_BASE`。**不允许**硬编码域名或回退到 `window.location.origin`。

## 3. 服务层布局

```
web/src/services/
├── http.js          # fetch wrapper:超时、取消、错误归一化
├── endpoints.js     # 每个公开资源一个函数,返回契约 data
├── fallback.js      # 开发环境可选静态回退(见 §8)
└── hooks.js         # useResource / useList / useDetail 三个 hook
```

页面 → `hooks.js` → `endpoints.js` → `http.js` → `fetch`。

### 3.1 `http.js`

- `request(path, { signal, timeoutMs }) -> Promise<{data, raw}>`。
- 拼 URL:`new URL(path, API_BASE)`;**不**自己拼接字符串。
- 默认 `Accept: application/json`;`GET` 不带 body。
- 超时:`AbortController` + `setTimeout`;超时抛 `ApiError({code:'timeout'})`。
- 错误归一化:
  - `res.ok === false` → `ApiError({code: mapStatus(res.status), status, body})`
  - JSON 解析失败 → `ApiError({code:'bad_payload'})`
  - `error.code` 枚举:`'timeout' | 'network' | 'not_found' | 'rate_limited' | 'server' | 'bad_payload' | 'unknown'`
- **不**自动重试;重试由 hook 层显式触发(见 §5)。

### 3.2 `endpoints.js`

每个契约资源一个纯函数:

```js
export const getSite        = (o) => request('/api/public/site', o).then(r => r.data[0] ?? null)
export const listDepartments= (o) => request('/api/public/departments', o).then(r => r.data)
export const listCouncil    = (o) => request('/api/public/council-members', o).then(r => r.data)
export const listStudios    = (o) => request('/api/public/studios', o).then(r => r.data)
export const getStudio      = (slug, o) => request(`/api/public/studios?slug=${enc(slug)}`, o).then(r => r.data[0] ?? null)
export const listEvents     = (o) => request('/api/public/events', o).then(r => r.data)
export const listProjects   = (o) => request('/api/public/projects', o).then(r => r.data)
export const listMembers    = (o) => request('/api/public/members', o).then(r => r.data)
export const listFeaturedMembers = (o) => request('/api/public/members?featured=true', o).then(r => r.data)
export const listWall       = (o) => request('/api/public/wall', o).then(r => r.data)
export const listNotes      = (o) => request('/api/public/notes', o).then(r => r.data)
export const getNote        = (slug, o) => request(`/api/public/notes?slug=${enc(slug)}`, o).then(r => r.data[0] ?? null)
// 既有契约
export const listArticles   = (o) => request('/api/public-articles', o).then(r => r.data)
export const getArticle     = (slug, o) => request(`/api/public-articles?slug=${enc(slug)}`, o).then(r => r.data[0] ?? null)
export const submitJoin     = (payload, o) => request('/api/public/join-applications', { ...o, method:'POST', body: payload })
```

`enc = encodeURIComponent`,禁止字符串拼接 query。

## 4. 状态模型 — 由 hook 层负责

统一三态:

```ts
type Resource<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready', data: T }
  | { status: 'error', error: ApiError, retry: () => void }
```

### 4.1 Hook API

```js
const site = useResource(getSite, [])                  // 单条
const departments = useResource(listDepartments, [])   // 列表
const member = useResource(
  (o) => getMember(id, o),
  [id],
  { notFoundOn: (d) => d === null }                    // 详情未命中 → notFound
)
```

- `useResource(fn, deps, opts)` 内部:`useEffect` + `AbortController`;deps 变化时 `abort()` 旧的、置 `loading`、发新请求。
- `opts.notFoundOn(data)` 返回 `true` → `status` 变 `'notFound'`(把 `data === null` 识别成 notFound 是详情页约定;**列表不进入 notFound**)。
- `retry` 触发同 fn 的重新执行,不清空 `deps`。

### 4.2 页面职责

| 状态 | 谁负责 | 行为 |
| --- | --- | --- |
| `idle` | hook | 首次渲染前短暂存在,页面当 loading 处理 |
| `loading` | 页面 | 显示骨架/skeleton,**不闪烁**(最少 200ms 后才展示 loading UI) |
| `ready` + 空数组 | 页面 | 显示空态文案,不当作错误 |
| `ready` + 非空 | 页面 | 正常渲染 |
| `notFound` | 页面 | 复用 `<NotFound />`,URL 不变 |
| `error` | 页面 | 显示"加载失败"+ `重试` 按钮调 `state.retry()` |

共享层(http/hooks)**不**渲染 UI,只吐状态;页面**不**直接处理 `AbortError`/`TypeError` 等底层异常。

## 5. 取消、竞态、重试

- **取消**:`useResource` 清理函数里 `controller.abort()`;`http.js` 把 `AbortError` 静默吞掉(不进 error 态)。
- **竞态**:hook 内 `requestId` 自增;只接受最后一次请求的结果,旧的响应丢弃。
- **重试**:只有用户点"重试"才重发,无自动退避;`submitJoin` 失败不自动重试(避免重复提交)。
- **限流**:`429` 映射为 `code:'rate_limited'`,页面提示"操作过于频繁,请稍后再试",重试按钮禁用 30s(本地计时,不依赖 `Retry-After`)。

## 6. 分页与缓存

- **不分页**:与契约一致(§0.8 上限 500);前端拿到全量后由 `useMemo` 做分类筛选(沿用现状,不改 `?cat=`/`?dept=` 的客户端筛选逻辑)。
- **缓存**:
  - 会话级内存缓存:同一 hook 同一参数,`Map` 存 `data`,TTL 60s;`retry()` 跳过缓存。
  - **不持久化**(localStorage/IndexedDB 都不用);刷新页面重新拉。
  - 静态页面(Home/About/Org 的 `SiteSettings`、Departments、Council、Studios)可以在 App mount 时预热一次,详情页不做预热。

## 7. `data/*.js` 退役路线

保留文件、改导出,**第一步先把"内容"清空、把"结构"留下**:

| 文件 | 改造后 |
| --- | --- |
| `site.js` | `SECTIONS`、`sectionOf` 保留(纯路由元数据);`ORG`/`PILLARS`/`MILESTONES` 改为 `null`/空数组占位 + 注释"由 `/api/public/site` 提供" |
| `content.js` | `DEPARTMENTS`/`COUNCIL`/`STUDIOS`/`PROJECTS`/`EVENTS`/`RECRUIT` 全部导空数组;`STAGES` 保留(枚举定义) |
| `news.js` | `NEWS_CATS` 保留(筛选 UI 顺序);`NEWS` 空数组 |
| `people.js` | `ROSTER_DEPTS` 保留;`MEMBERS`/`ROSTER`/`WALL` 空数组 |
| `notes.js` | `NOTE_CATS` 保留;`NOTES` 空数组 |

**第二步**(等所有页面切到 hook 后):逐个删掉空导出、清理 import;第一步期间页面混用静态与 API 是允许的,但同一块 UI 不能两边都渲染。

## 8. 开发环境 fallback

- **默认不允许 fallback**:API 挂了就显示错误态,不静默切回静态数据——避免"以为联调了其实在看旧数据"。
- 唯一例外:`VITE_API_FALLBACK_STATIC=1` 时,`fallback.js` 把 `data/*.js` 的**未清空副本**(从 git 历史读)当数据源;此模式只在本地开发,`vite build` 时 `import.meta.env.DEV === false` 直接 tree-shake 掉。
- CI/预览构建不设该变量。

## 9. 与路由/视觉的兼容约束

- `?cat=`、`?dept=` 参数名与取值**不变**(值仍用中文分类名,与数据一致)。
- `News`/`Popular` 详情页 URL 段仍是 `id`(契约中实际按 `slug` 查询);前端在详情页用 `slug` 字段请求,但路由 path 保持 `/news/:id` 以免改样式与外链。
- 首页 `FACTS` 中"位会员"等计数来自 `members.length`,API 未就绪时显示 `—` 而不是 `0`,避免闪动。

## 10. 不做的事

- 不引入 React Query/SWR 等第三方库——约定足够轻,先用手写 hook。
- 不做 SSR/SSG/ISR——前端仍是 Vite SPA。
- 不在本约定里定义表单校验规则——`Join` 的字段校验属 Issue #7 之后单独的"表单与提交 UX"任务(可在实现时一并定)。
- 不定义登录态/会话——公开站无登录,管理后台走 Payload 自身。

## 11. 验收锚点(供 Issue #8 用)

- [ ] `web/` 目录下 `grep -R "fetch(" src/` 只在 `services/http.js` 命中。
- [ ] 每个页面在 API 断网时显示可重试错误态;`/:id` 不存在时显示 `NotFound`。
- [ ] 切到 API 后,`?cat=`/`?dept=` 筛选、`/news/:id` 详情上下篇导航、会员名录搜索仍按原 UX 工作。
- [ ] `npm run build` 无 `data/*.js` 相关警告;`data/` 文件中保留的导出(`SECTIONS`/`NOTE_CATS`/`ROSTER_DEPTS`/`STAGES`)仍能编译通过。
