# 后端 API 文档

> 适用对象：前端（`src/services/`）调用方。
> 后端是部署在 `manage.bioqif.com` 的 Payload CMS（旧版，仅文章模块）。
> 文档基于 2026-10-08 实测，所有示例均可直接运行。

## 总览

| 项 | 值 |
|---|---|
| Base URL | `https://manage.bioqif.com` |
| 备用域名 | `https://cms.bioqif.com`（同一后端，nginx 反代到同一容器） |
| 协议 | HTTPS only，HTTP 301 到 HTTPS |
| 认证 | 公开端点无需认证；写操作走 `/admin` 网页后台 |
| 数据格式 | JSON，UTF-8 |
| CORS 白名单 | `bioqif.com`、`www.bioqif.com`、`127.0.0.1:8000-8002`、`localhost:8000-8002` |

## 公开端点

### `GET /api/public-articles`

返回所有**已发布**（`_status=published`）文章，按 `publishedAt` 倒序。草稿不出现。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `slug` | string | 按 slug 精确匹配单篇，如 `?slug=bioqif_new` |
| `id` | string | 按 Payload 数字 id 精确匹配，如 `?id=3` |
| （无） | — | 不带参数返回全部（limit 100） |

> `slug` 和 `id` 同时传时按 `and` 过滤，实际用其一即可。

**Response `200`**

```json
{
  "data": [
    {
      "id": "3",
      "slug": "bioqif_new",
      "title": "生物启扉协会第一届全体（扩大）会议顺利召开",
      "summary": "6月12日，江西农业大学…",
      "content": "<div class=\"payload-richtext\"><p>…</p></div>",
      "cover": "https://manage.bioqif.com/api/media/file/psc.jpg",
      "category": [
        { "name": "工作动态", "slug": "association-news" },
        { "name": "BANNER", "slug": "banner" }
      ],
      "author": "易家乐、王鑫宇",
      "source": "宣传部",
      "editor": "易家乐",
      "reviewer": "陈小红、易家乐",
      "published_at": "2026-06-12T12:00:00.000Z",
      "featured": true,
      "views": 63,
      "date_created": "2026-06-24T06:45:50.640Z"
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 空值行为 | 备注 |
|---|---|---|---|
| `id` | string | 必有 | Payload 数字 id 转成的字符串 |
| `slug` | string | 必有 | URL 友好标识，前端路由建议用它 |
| `title` | string | 必有 | |
| `summary` | string | 必有 | 摘要，≤300 字 |
| `content` | string(HTML) | 必有 | Lexical 富文本已转 HTML；含 `<p>`、`<a>`、`<img>` 等，直接 `dangerouslySetInnerHTML` |
| `cover` | string\|null | `null` | 完整 URL；无封面时是 `null` 不是 `""` |
| `category` | array | `[]` | 多栏目场景返回全部；`name` 是中文、`slug` 是英文标识 |
| `author` | string | `"生物启扉协会"` | 空时后端兜底成协会名 |
| `source` | string | `"生物启扉协会"` | 同上 |
| `editor` | string | `"生物启扉协会"` | 同上 |
| `reviewer` | string | `"生物启扉协会"` | 同上 |
| `published_at` | ISO8601 | 必有 | 带时区（UTC），前端展示时按需格式化 |
| `featured` | boolean | `false` | 首页推荐标记 |
| `views` | number | `0` | 浏览量，由 `POST /api/article-view/:id` 自增 |
| `date_created` | ISO8601 | 必有 | 记录在 CMS 中创建时间 |

**请求示例**

```bash
# 列表
curl 'https://manage.bioqif.com/api/public-articles'

# 按 slug
curl 'https://manage.bioqif.com/api/public-articles?slug=bioqif_new'

# 按 id
curl 'https://manage.bioqif.com/api/public-articles?id=3'
```

---

### `POST /api/article-view/:id`

给指定文章的 `views` 字段 +1。**只对已发布文章有效**。

**Path 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | number | Payload 数字 id（**不是 slug**） |

**Response**

| 状态 | 场景 | body |
|---|---|---|
| `200` | 自增成功 | `{"views": 64}` |
| `400` | 缺 id | `{"error": "Missing article id"}` |
| `404` | 文章不存在或是草稿 | `{"error": "Article not found"}` |

**示例**

```bash
curl -X POST https://manage.bioqif.com/api/article-view/3
# → {"views":64}
```

> ⚠️ 前端**不要**在渲染详情页时无脑调用——这会让每次刷新都自增。如果要统计真实阅读，建议配合 localStorage 去重或延迟触发。

---

### `GET /api/categories`

公开读。返回所有新闻栏目（分类），Payload 原生分页格式。

```bash
curl 'https://manage.bioqif.com/api/categories?limit=20'
```

```json
{
  "docs": [
    { "id": 6, "name": "BANNER",   "slug": "banner",            "sort": 0, "updatedAt": "…", "createdAt": "…" },
    { "id": 2, "name": "通知公告", "slug": "notices",            "sort": 0, "updatedAt": "…", "createdAt": "…" },
    { "id": 1, "name": "工作动态", "slug": "association-news",   "sort": 0, "updatedAt": "…", "createdAt": "…" }
  ],
  "totalDocs": 3, "limit": 20, "page": 1, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false
}
```

> `sort` 是管理端排序权重，不是返回顺序。当前返回按 `createdAt` 倒序（Payload 默认），`BANNER` 栏目实际最新。

---

### `GET /api/media`

公开读。返回已上传图片，Payload 原生分页格式。

```bash
curl 'https://manage.bioqif.com/api/media?limit=20'
```

每项含 `filename`、`alt`、`width`、`height`、`url`（完整可访问 URL），`sizes.card`/`sizes.thumbnail` 有裁剪变体。

---

### `GET /api/media/file/:filename`

直接下载图片二进制（Payload 内置媒体路由）。`cover` 字段返回的就是这个 URL。

---

### `GET /api/articles`（原生 Payload REST）

⚠️ **不建议前端用**。虽然 access control 允许匿名读已发布文章，但：
- 返回的是 Payload 原生格式（`docs[]` + `category` 是嵌套对象不是扁平 `{name,slug}`）
- `content` 是 Lexical JSON 不是 HTML，前端要自己转
- 分页、排序参数与 `/api/public-articles` 不同

公开场景**始终用 `/api/public-articles`**，这个原生端点只对调试/排查有意义。

## 管理端点（需登录）

| 路径 | 用途 |
|---|---|
| `GET /admin` | 管理后台 UI（Payload 自带） |
| `POST /api/users/login` | 登录，返回 JWT |
| `GET /api/users/me` | 当前用户 |
| `POST /api/users/logout` | 登出 |
| `GET /api/articles` 写操作 | 需 `Authorization: Bearer <jwt>` |
| `GET /api/graphql` | GraphQL 端点（Payload 自带） |
| `GET /api/graphql-playground` | GraphiQL IDE |

管理接口前端**不用关心**，写文章都在 `/admin` 网页里做。

## 前端适配层映射

本地 `src/services/articles.js` 把后端字段映射成 `src/data/news.js` 的形状：

| 后端字段 | 前端字段 | 转换逻辑 |
|---|---|---|
| `slug` | `id` | `a.slug \|\| String(a.id)` |
| `category[0].name` | `cat` | 取第一个栏目名作为单选分类 |
| `published_at.slice(0,10)` | `date` | `"2026-06-12T12:00:00.000Z"` → `"2026-06-12"` |
| `title` | `title` | 直通 |
| `summary` | `excerpt` | 直通 |
| `source` | `source` | 直通（已含兜底） |
| `views` | `views` | 直通 |
| `content` | `body` | `[content]` 包成数组；标记 `_raw` 区分 HTML |
| `cover` | `cover` | 直通（`null` 时前端渲染占位 Cover） |
| `featured` | `featured` | 直通 |
| — | `_raw` | 非空表示远程数据，用于决定 body 渲染方式 |

## 错误形状

| 场景 | HTTP | body |
|---|---|---|
| 文章不存在 | `200` | `{"data": []}`（注意：不是 404） |
| `article-view` 文章不存在/草稿 | `404` | `{"error": "Article not found"}` |
| `article-view` 缺 id | `400` | `{"error": "Missing article id"}` |
| 未知路由 | `404` | `{"message": "Route not found \"/api/xxx\""}` |
| nginx 挂了 / 容器停了 | `502` | nginx 错误页（非 JSON） |

## CORS 与同源策略

**推荐做法：前端始终用相对路径 `/api/*`，让 dev proxy / 生产 nginx 来管转发**，这样前端代码零 CORS 感知。

- dev（`npm run dev`）：vite `server.proxy` 把 `/api/*` 转到 `https://manage.bioqif.com`
- 生产（部署到 `bioqif.com`）：nginx `location /api/` 反代到 `http://127.0.0.1:3000`（与静态文件同域同端口）

只有在**明确要绕开 proxy**（比如本地直接 curl 测线上）时，才设 `VITE_API_BASE=https://manage.bioqif.com`。

后端自身的 CORS 白名单（仅在你显式跨域调用时才相关）：

- `Access-Control-Allow-Origin` 是**白名单精确匹配**，不在名单内的 origin 会收到兜底值 `https://www.bioqif.com`（不是 `*`、不是反射）
- 允许的 header：`Content-Type`；允许的方法：`GET, OPTIONS`（公开端点）
- 白名单：`bioqif.com`、`www.bioqif.com`、`localhost:8000-8002`、`127.0.0.1:8000-8002`
- `localhost:5173`（vite dev 默认端口）**不在白名单**——这就是为什么 dev 要用 proxy 而不是直连

## 运维自查

```bash
# 容器状态
ssh birdproxy 'sudo docker ps --format "table {{.Names}}\t{{.Status}}" | grep bioqif'

# 容器内部直连（绕过 nginx）
ssh birdproxy 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/public-articles'

# DB 连通
ssh birdproxy 'sudo docker exec bioqif-payload-database psql -U bioqif_payload -d bioqif_payload -c "select count(*) from articles;"'

# nginx 配置位置
# /etc/nginx/sites-enabled/{cms,manage}.bioqif.com → proxy_pass http://127.0.0.1:3000
```

## 数据现状（2026-10-08 快照）

- 文章：1 篇（`bioqif_new`，栏目 `工作动态` + `BANNER`，featured）
- 栏目：3 个（`工作动态`/`notices`/`BANNER`）
- 媒体：2 张图
- 管理后台：`https://manage.bioqif.com/admin`（需自行注册首个账号）
