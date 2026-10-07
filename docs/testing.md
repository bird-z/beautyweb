# 测试与验收策略

本文档回答 Issue #8:第一阶段最小质量门槛。目标不是"高覆盖率",而是**能证明公开站不再依赖 `web/src/data/*.js`,且公开 API 契约被满足**。

状态:草案 v1。当前仓库**零测试、零 CI**,本文件是从 0 到 1 的最低方案。

## 1. 分层与目标

| 层 | 覆盖什么 | 通过 = |
| --- | --- | --- |
| **L0 构建检查** | TS/JS 语法、依赖、产物可构建 | `npm run build` 全绿 |
| **L1 单元/集成** | seed 幂等、Payload access、富文本转换 | `vitest run`(新增,见 §4) |
| **L2 API 契约** | `docs/api/public-rest-api.md` 每节的响应形状 | `vitest run tests/contract`(新增) |
| **L3 端到端冒烟** | 5 条页面路径在真实部署下可访问 | `playwright`(可选,见 §6) |

**质量门槛 = L0 + L2 必须过;L1 在有改动时跑;L3 是第一阶段的"有人走一遍",后续才自动化。**

## 2. 测试数据库与隔离

- **本地**:`DATABASE_URL=postgresql://bioqif_payload:test@127.0.0.1:5433/bioqif_payload_test`——**独立数据库**,不复用 dev 库;`compose` 里加一个 `database-test` 服务或本地启 `postgres:16-alpine` 容器跑测试用。
- **CI**:GitHub Actions `services:` 起 `postgres:16-alpine`,数据库名 `bioqif_payload_test`,密码 `test`(CI 内部,不泄露)。
- **隔离规则**:
  - 每个 `vitest` 测试文件以 `payload.db.destroy()` + 新建连接的方式运行;**不**在测试间复用 `getPayload` 实例。
  - 数据清理由 seed 自己负责——`seed-content.ts` 的 upsert 语义保证跑两次结果一致;**不**用 truncate,避免破坏 Payload versions 表。
- **从不跑生产**:测试脚本默认 `NODE_ENV=test`;`seed:demo` 只在 `NODE_ENV=development && ALLOW_DEMO_SEED=1` 时可用。

## 3. 构建检查(L0)

```bash
npm run build            # 根 script,串行跑 web + server
npm run lint:web         # 若 web 配了 lint
```

- **必过**,挂在 PR required check 上。
- `server/.next/dev/types/routes.d.ts` 是 dev-server 生成物,不应进 git——加进 `.gitignore`,别再像现在这样 dirty。

## 4. 单元/集成测试(L1)

工具:**vitest**(零 ejected 依赖,匹配 Vite 生态);`server/` 下加一个 `vitest.config.ts`,`tests/` 目录就近放。

| 测试文件 | 断言 |
| --- | --- |
| `tests/seed.test.ts` | `seed()` 跑两次,`totalDocs` 相同;`departments=4`、`council-members=5`、`studios=2`、`projects=4`、`events=4`、`members=6`、`wall-entries=10`(7 pub + 3 draft)、`notes=NOTES.length` |
| `tests/access.test.ts` | `join-applications` 匿名 `read` → `forbidden`;`create` → 允许;`update` 需登录 |
| `tests/lexical.test.ts` | `notes.content` 从 `blocks` 转出的 Lexical 有 `root.children`,`convertLexicalToHTML` 不抛异常 |

**只测策略文档里承诺的行为**,不测 Payload 自身。

## 5. API 契约测试(L2)—— 本阶段最重要

`server/tests/contract/*.test.ts`,每个资源一个文件;通过 HTTP 请求本地 `next dev` 或 `next start` 实例断言响应形状,**不**直接调 `payload.find`(那是 L1 的事)。

### 5.1 断言模板

对每个 `GET /api/public/<x>`:

- `res.status === 200`
- `Content-Type` 含 `application/json`
- `res.headers['access-control-allow-origin']` 在白名单
- `body.data` 是数组
- 每个元素**只**包含契约列出的字段(深度相等键集,不允许额外键)
- 空集合时 `body.data === []`(不是 404)

对详情(`?slug=`/`?id=`):命中返回 1 元素数组,未命中 `[]`。

### 5.2 逐资源最小断言

| 资源 | 必断言字段 | 反断言(绝不出现) |
| --- | --- | --- |
| `site` | `school name en slogan mailOffice` | `_status` |
| `departments` | `id name en description` | `sort` `_status` `createdAt` |
| `council-members` | `id title name` | `sort` |
| `studios` | `id slug name en description tags[]` | — |
| `events` | `id term title statusLabel description date` | — |
| `projects` | `id title stage statusLabel description` | — |
| `members` | `id name pinyin tag department{name,en} college year bio quote tags[] featured` | `contact`/`message`(本就不该在 members) |
| `wall` | `id kind caption dateLabel image ratio` | `media.filename/filesize` |
| `notes` | `id slug category title date lede content(html)` | — |
| `articles`(既有) | 契约 §3 原样 | `_status` `views` 不可写 |
| `join-applications` POST | `201` + `{data:{id}}`;缺字段 `400`;`status` 注入被忽略 | 任何 GET 返回 `join-applications` 字段 |
| `article-view` POST | `{views}` 递增;`404` 当 slug 不存在 | — |

### 5.3 跑法

```bash
# 本地
npm --prefix server run dev &            # 3000
DATABASE_URL=test npm run test:contract  # vitest run tests/contract

# CI
services: postgres → npm run migrate → npm run seed → npm run start → npm run test:contract
```

## 6. 端到端冒烟(L3)

第一阶段**手写清单**,不做 Playwright:

1. `GET https://bioqif.com/` → 200,DOM 里有"生物启扉协会"。
2. `GET https://bioqif.com/news` → 列出 ≥1 条新闻。
3. `GET https://bioqif.com/news/<slug>` 详情页有正文(不是空段落)。
4. `GET https://bioqif.com/join` → 表单可提交一条测试申请(手动在后台删除)。
5. `GET https://bioqif.com/members` → 名录数量与后台 `members` 集合 `published` 数一致。

等 UI 稳定后再升级为 Playwright(单独 ticket,不在本阶段)。

## 7. 前端"不再依赖 data/*.js"的验证

这是 Issue #8 要求的**可证伪验收**:

- `grep -R "from '../data/" web/src/pages/` 必须只剩"结构导出"(`SECTIONS`/`NOTE_CATS`/`ROSTER_DEPTS`/`STAGES`),不得 import 任何内容数组(`NEWS`/`MEMBERS`/`ROSTER`/`WALL`/`DEPARTMENTS`/`COUNCIL`/`STUDIOS`/`PROJECTS`/`EVENTS`/`ORG`/`PILLARS`/`MILESTONES`/`RECRUIT`)。
- `npm run build` 在断网状态下(或 `VITE_API_BASE` 指向无效地址)依然能 build 通过——证明构建期不依赖后端。
- 运行时把后端关掉,前端每页显示错误态/空态而**不白屏**,证明数据来自 API。

## 8. CI 工作流(最低限度)

`.github/workflows/ci.yml`(待创建)三个 job,**并行**:

```yaml
jobs:
  build:
    steps: [checkout, setup-node@22, npm ci (root+web+server), npm run build]
  contract:
    services: postgres:16
    steps: [checkout, setup-node, npm --prefix server ci,
            npm --prefix server run migrate,
            npm --prefix server run seed,
            npm --prefix server run start &,
            wait-on http://localhost:3000/api/health,
            npm --prefix server run test:contract]
  unit:
    services: postgres:16
    steps: [checkout, setup-node, npm --prefix server ci,
            npm --prefix server run test]   # vitest run
```

- PR required checks:`build` + `contract`。
- `unit` 允许失败不阻塞(第一阶段;`access`/`seed` 测试稳定后再转 required)。

## 9. 本阶段不做

- 不做 E2E 自动化(手写冒烟代替)。
- 不做视觉回归、性能预算、Lighthouse CI。
- 不测 admin UI 的交互(交给 Payload 自身测试)。
- 不做测试覆盖率门槛——只要求"契约里承诺的都测到"。

## 10. 实施差异清单(转为任务)

- [ ] `server/`:`vitest` + `vitest.config.ts` + `tests/{seed,access,lexical}.test.ts`
- [ ] `server/`:`tests/contract/*.test.ts` + `npm run test:contract`
- [ ] `server/`:补 `GET /api/health` 路由(契约 §5 已经预留)
- [ ] `server/`:`seed-content.ts` 按 `docs/api/data-migration.md` §8 修 upsert 不写 `_status`
- [ ] `.github/workflows/ci.yml`:三个 job,`build` + `contract` 设为 required
- [ ] `.gitignore`:加 `server/.next/`(已有)和 `.env*` 兜底
