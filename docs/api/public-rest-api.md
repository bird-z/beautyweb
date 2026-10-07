# 公开 REST API 契约

本文件是 `web/` 前端与 `server/`(Next.js + Payload)之间**唯一受支持的公开数据接口**契约。目标是：前端只依赖本文档描述的路径、查询参数与响应形状；实现阶段新增的端点必须先在本文件登记后才能上线。

状态:草案 v1(锁定于 Issue #3)。与既有 `/api/public-articles`、`/api/article-view/:id` 保持完全兼容。

## 0. 总则

### 0.1 Base URL

- 生产:`https://cms.bioqif.com`(以部署决策为准,Issue #5)
- 本地:`http://localhost:3000`
- 前端通过环境变量 `VITE_API_BASE` 注入,代码里不允许硬编码域名。

### 0.2 命名与版本

- 所有公开读端点以 `/api/public/` 开头:`/api/public/<resource>`。
- 公开写端点(仅加入申请、浏览量)不走 `public` 命名空间,沿用既有路径。
- **无 URL 版本号**。破坏性变更必须新增端点或新增字段,不得修改既有字段含义。

### 0.3 请求约定

- 除注明外,所有端点都是 `GET`,响应 `Content-Type: application/json; charset=utf-8`。
- 查询参数一律 snake_case;未知参数静默忽略(不报错)。
- `OPTIONS` 预检对所有公开端点返回 `204`。

### 0.4 响应包络

所有公开读端点统一包络:

```json
{ "data": [ ... ] }
```

- 列表:`data` 为数组;**空列表返回 `[]`,HTTP 200,不返回 404**。
- 详情(带 `?id=` 或 `?slug=`):`data` 仍为数组,命中返回 1 个元素,未命中返回 `[]`(与既有 `public-articles` 行为一致,见 §10)。
- 元信息当前只保留 `data`;`meta`(分页计数等)为可选字段,未出现即不可用,前端不得依赖。

### 0.5 错误格式

统一 JSON 错误体:

```json
{ "error": { "code": "not_found", "message": "Article not found" } }
```

- `code` 是机器可读枚举,`message` 仅供调试,**不展示给访客**。
- 状态码:`400` 参数错误、`404` 资源不存在、`429` 触发限流、`500` 服务端错误。
- 历史兼容:`/api/article-view/:id` 返回 `{ "error": "..." }` 字符串形式(已有契约,见 §10);**新端点一律用对象形式**,旧端点不改。

### 0.6 CORS 与缓存

- `Access-Control-Allow-Origin` 白名单与 `payload.config.ts` 一致(`bioqif.com`、本地 `5173/8000-8002`);未命中回退 `https://www.bioqif.com`。
- 所有公开读端点 `Cache-Control: no-store`(与现有实现一致)。是否引入 CDN/边缘缓存属 Issue #5 范围,本契约不承诺缓存行为。
- `Vary: Origin` 必须存在。

### 0.7 字段通用规则

- `id` 一律序列化为 **字符串**(即便底层是数字)。
- 富文本(Lexical)统一在服务端用 `convertLexicalToHTML` 转成 **HTML 字符串**;前端用 `dangerouslySetInnerHTML` + 白名单 sanitizer 渲染,不接收原始 Lexical JSON。
- 日期:`date` 字段返回 `YYYY-MM-DD`;`publishedAt`/`createdAt`/`updatedAt` 返回 ISO 8601 完整时间戳。
- 媒体字段展开为对象:`{ url, alt, width, height }`,缺失时为 `null`。**绝不返回** `filename`、`filesize`、`mimeType`、磁盘路径等内部细节以外的字段时以对象浅展开为准,详见 §9。
- `_status` 过滤在服务端完成,响应中**不输出 `_status`**。

### 0.8 排序与筛选

- 统一用 `?sort=` 显式声明,默认各资源在各自小节给出;多字段用逗号,`-` 前缀表示降序。
- 前端侧分类/筛选(如新闻 `?cat=`、会员 `?dept=`)**当前在客户端完成**,契约不承诺服务端筛选参数;后续如需服务端筛选,新增参数须先登记。
- 无分页:所有列表一次性返回,服务端 `limit` 上限 500。当前数据量(≈7 条新闻、120+ 会员、6 条笔记)无需游标;如单资源突破 500 条,先登记 `meta`/`page` 方案再加参数。

### 0.9 Slug 规则

- 允许字符:`a-z 0-9 -`,长度 ≤ 80。
- 已发布资源的 slug 视为**不可变**;改名流程是新建条目 + 前端重定向,不走本契约。

---

## 1. 站点信息 — `GET /api/public/site`

返回 `SiteSettings` global 的公开子集。

```json
{
  "data": [{
    "school": "江西农业大学",
    "name": "生物启扉协会",
    "en": "BioQif Association",
    "slogan": "启迪生命 · 扉向未来",
    "sloganEn": "Enlightenment · Innovation · Future",
    "motto": "...",
    "address": "...",
    "mailCoop": "contact@bioqif.com",
    "mailOffice": "office@bioqif.com",
    "pillars": [{ "name": "...", "en": "...", "description": "..." }],
    "milestones": [{ "when": "...", "title": "...", "description": "..." }],
    "recruitmentRules": ["..."]
  }]
}
```

- `data` 仍为单元素数组以保持包络一致。
- 邮箱地址为公开对外联系方式,允许返回。

## 2. 组织架构

### `GET /api/public/departments`

`sort=sort`,升序。元素:

```json
{ "id": "...", "name": "秘书部", "en": "Secretariat", "description": "..." }
```

### `GET /api/public/council-members`

`sort=sort`,升序。元素:`{ "id", "title", "name" }`。**不返回** `sort`、`_status`。

### `GET /api/public/studios`

`sort=sort`;支持 `?slug=` 取详情(用于后续工作室子页)。

```json
{ "id", "slug", "name", "en", "description", "tags": ["..."] }
```

`tags` 由 `array` 字段展平为字符串数组。

## 3. 新闻 — 既有契约(不可破坏)

- `GET /api/public-articles`,参数 `id` / `slug`;`data` 数组,字段见 `server/src/app/(frontend)/api/public-articles/route.ts`,**保持现状**。
- `POST /api/article-view/:id`:响应 `{ "views": number }`;防刷规则(同一访客短窗口不重复计数)维持服务端现状,前端不感知。

> 新增集合的公开端点统一放 `/api/public/<plural>`;`articles` 保留历史路径不迁移,避免破坏已部署的集成。

## 4. 品牌活动 — `GET /api/public/events`

`sort=-date,sort`(日期降序、`sort` 升序兜底)。

```json
{ "id", "term": "2025 秋", "title": "...", "statusLabel": "已举办", "description": "...", "date": "2025-10-12" }
```

前端按 `term` 分组渲染。

## 5. 科创项目 — `GET /api/public/projects`

`sort=sort`。

```json
{ "id", "title", "stage": "incubating|building|released", "statusLabel": "孵化中", "description": "..." }
```

- `stage` 为机器枚举;`statusLabel` 为展示文案,前端不二次映射。

## 6. 会员档案 — `GET /api/public/members`

`sort=name`(或后续加入 `sort` 字段后改 `sort`)。支持 `?featured=true` 仅返回首页展示位成员。

```json
{
  "id", "name", "pinyin", "tag",
  "department": { "id", "name", "en" },
  "college", "year", "bio", "quote",
  "tags": ["..."], "featured": true
}
```

- `department` 展开为浅对象(id+name+en)。
- 公开 API **只返回 `featured=false` 也能展示**——是否公开由 `_status` 控制,本契约不暴露后台标记。

## 7. 校园墙 — `GET /api/public/wall`

`sort=sort`。

```json
{ "id", "kind": "活动|校园|观察", "caption", "dateLabel", "image": { "url", "alt", "width", "height" } | null, "ratio": 1 }
```

## 8. 知识笔记 — `GET /api/public/notes`

`sort=-date`;支持 `?slug=` 详情。

```json
{ "id", "slug", "category": "调试", "title", "date": "2025-11-02", "lede", "content": "<p>...HTML...</p>" }
```

`content` 为 Lexical→HTML;`category` 为自由文本(暂不做 categories 关系),前端按 `?cat=` 在客户端分组。

## 9. 加入申请 — `POST /api/public/join-applications`

唯一的公开写端点。

请求体:

```json
{
  "name": "...", "contact": "...", "college": "...", "major": "...",
  "year": "...", "department": "...", "interests": ["..."], "message": "..."
}
```

- 服务端把 `interests: string[]` 转成 `[{value}]` 落库;`status` 强制 `pending`,**忽略客户端提交的 `status`**。
- 响应 `201`: `{ "data": { "id": "..." } }`;校验失败 `400` + 错误对象。
- **隐私红线**:记录含 `contact`、`message`,禁止出现在任何 GET 响应或 admin 列表以外的位置;`GET /api/public/join-applications` **不存在**;集合 `read` 仍 `adminsOnly`。
- 限流:同一 IP 每分钟 ≤ 3 次提交(超出返回 `429`);具体实现由 Issue #8 测试策略兜底。

## 10. 兼容性说明

- `public-articles` 详情通过 `?id=`/`?slug=` 查询、命中返回 1 元素数组、未命中返回空数组——**这是已运行契约,不得改**。
- `article-view` 的 `{ "error": "..." }` 字符串错误是历史形状,保留;新端点用对象错误。
- 新端点详情查询沿用同一约定(`?slug=` 返回数组),前端取 `data[0]` 判空即可,避免两套判空逻辑。

## 11. 明确不返回的字段

- `_status`、`createdAt`/`updatedAt`(除非 §0.7 列出)、内部 `sort`(除非作为排序文档说明)、`v`/`__v`、Payload 的 `depth` 参数本身。
- `join-applications` 的任何字段不出现在 GET。
- `users`、`media` 的内部元数据(`filename`/`filesize`/`mimeType`/`storageKey`)不直接暴露;`media` 仅以 `{url,alt,width,height}` 浅对象出现在其他资源里。

## 12. 未来管理 API 扩展

- 管理端继续使用 Payload 自带 `/api/*`(collections/graphql)与 `/admin` 后台;**不向公开契约暴露**。
- 若未来要给前端提供"编辑中"预览,走 Payload 的 draft 机制 + 登录态,**不新增公开预览端点**。
- 公开契约内的任何破坏性变更流程:先在本文件登记新字段/端点 → 上线兼容期 → 旧字段标记 deprecated → 至少一个发布周期后才允许删除。

## 13. 与前端数据文件的映射(验收锚点)

| `web/src/data` 导出 | 公开端点 | 备注 |
| --- | --- | --- |
| `ORG`/`PILLARS`/`MILESTONES`/`RECRUIT` | `/api/public/site` | SiteSettings global |
| `DEPARTMENTS` | `/api/public/departments` | 排序 `sort` |
| `COUNCIL` | `/api/public/council-members` | |
| `STUDIOS` | `/api/public/studios` | `key` → `slug` |
| `PROJECTS`/`STAGES` | `/api/public/projects` | `stage` 数字→枚举 |
| `EVENTS` | `/api/public/events` | `term` 分组由前端做 |
| `NEWS`/`NEWS_CATS` | `/api/public-articles` | 既有契约,category 多选 |
| `MEMBERS`/`ROSTER`/`ROSTER_DEPTS` | `/api/public/members` | `dept` → `department` 关系 |
| `WALL` | `/api/public/wall` | `image` 浅对象 |
| `NOTES`/`NOTE_CATS` | `/api/public/notes` | `blocks` → `content` HTML |
| `Join.jsx` 提交表单 | `/api/public/join-applications` | 新写端点 |

