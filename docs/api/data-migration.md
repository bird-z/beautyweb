# 静态数据迁移与初始化数据策略

本文档回答 Issue #4:`web/src/data/*.js` → Payload 集合的迁移规则、占位/测试数据处置、seed 组织、幂等性、发布状态、图片 URL、以及迁移后如何验证前端不丢数据。

状态:草案 v1,与 `docs/api/public-rest-api.md` 配套使用。当前 seed 实现位于 `server/scripts/seed-content.ts`(已存在,236 行)。

## 1. 总原则

- **唯一可信源**:迁移后数据库是唯一可信源;`web/src/data/*.js` 是**过渡期的种子来源**,不是运行期依赖。
- **一次迁移、持续维护**:seed 脚本只在数据库为空或被显式触发时运行;之后的内容变更走 Payload 后台,**不回写 `data/*.js`**。
- **占位数据不静默进库**:能判断为占位/演示的内容(下文明示)不进入 seed;需要"占位但可见"的条目以显式字段标记,而不是靠文案识别。
- **幂等**:重复执行 seed 不产生重复记录、不覆盖管理员的后续编辑(见 §4)。

## 2. 数据分类

对每条 `data/*.js` 记录先归入三类之一,再决定入库策略:

| 类别 | 判据 | 入库策略 |
| --- | --- | --- |
| **真实** | 现站可核实文案/名单(如 `DEPARTMENTS`、`COUNCIL`、`STUDIOS`、`ORG`、`PILLARS`、`MILESTONES`、前 6 位 `MEMBERS`、前 7 条 `WALL` 中文字部分) | 入库,`_status=published` |
| **占位但保留** | 文案标注「待公布」「占位」「待补充」,但结构上需要位置(如 `COUNCIL` 姓名"待公布"、`WALL` 后 3 条"待定"、`NEWS` 中 2 条 `*-placeholder`) | 入库,`_status=draft`,并在后台通过标题/文案可辨;**公开 API 不返回** |
| **演示/测试** | `demo: true` 的程序生成数据(`ROSTER` 后 118 条合成会员) | **不入库**;需要演示环境时用独立脚本,见 §6 |

## 3. 逐项迁移映射

来源列是 `web/src/data/*.js` 的导出名;`→` 后是给定集合的字段写入。所有 `tags`/`interests`/`recruitmentRules` 等 `array` 字段都写成 `[{ value }]`。

| 来源 | 集合/Global | 关键映射与处理 |
| --- | --- | --- |
| `ORG`, `PILLARS`, `MILESTONES`, `RECRUIT` | `site-settings` global | `updateGlobal` 整体覆盖;`RECRUIT` 硬编码字符串 → `recruitmentRules` |
| `DEPARTMENTS` | `departments` | `text→description`;`sort` 用数组下标 |
| `COUNCIL` | `council-members` | `title+name` 作唯一键;"待公布" 记录照常入库(本身是真实结构占位) |
| `STUDIOS` | `studios` | `key→slug`,`text→description`,`tags` 转 array |
| `PROJECTS` | `projects` | `stage` 数字 `0/1/2` → `incubating/building/released`;`status→statusLabel` |
| `EVENTS` | `events` | 展开 `term` 分组;`sort = groupIndex*100 + itemIndex`(同现状) |
| `NEWS` | **不迁** | 新闻走既有 `articles` 集合 + 现有后台;占位新闻不重复导入 |
| `MEMBERS`(前 6 条真实) | `members` | `dept` 中文名 → `departments` 关系 id;`bio`/`quote` 占位文案照常写入但依赖 `_status` 控制可见性;`featured=true` |
| `ROSTER`(后 118 条,`demo: true`) | **不入库** | 见 §6 |
| `WALL` | `wall-entries` | `date→dateLabel`;`image` 字段留空;后 3 条"待补充"改 `_status=draft` |
| `NOTES` | `notes` | `id→slug`,`cat→category`,`blocks` 数组 → Lexical(`h→heading`,`p→paragraph`,`code→paragraph` 暂保留为代码样式的段落,`ul→list`) |

> `NOTES.blocks` 的 `code` block 目前映射为普通 paragraph,**不保留等宽样式**。如要精确还原,需要在 Lexical 中用 `code` block 节点或前台 CSS 标记——这在数据迁移范围外,留给前端排版阶段决策。

## 4. 幂等规则

- **匹配键**(每个集合的 upsert `where`):
  - `departments`: `name`
  - `council-members`: `and[title,name]`
  - `studios`: `slug`
  - `projects`: `title`
  - `events`: `and[term,title]`
  - `members`: `name`(同名冲突时人工处理,当前无重复)
  - `wall-entries`: `and[caption,sort]`(因 caption 重复,"待补充" 占位)
  - `notes`: `slug`
  - `site-settings`: 单例,直接 `updateGlobal`
- **更新策略**:命中即 `update` 全量覆盖 seed 中给出的字段;**不写 `updatedAt`、不动 `_status` 为 `published` 之外的状态**。如果管理员在后台把某条 `published` 改成 `draft`,seed 再次运行不应强行拉回 `published`——seed 只在"记录不存在"时初始化 `_status`,存在时跳过该字段。

  > 当前 `seed-content.ts` 每次都写 `_status: 'published'`,需要改成"create 时写 published,update 时省略 `_status`"。这是一处需要跟随本策略修改的实现差异。

- **顺序**:`departments` 必须先 seed,`members.department` 依赖它的 id。

## 5. 图片与媒体

- 现阶段 `data/*.js` 中**没有真实图片 URL**(`WALL` 全是图注占位、新闻封面待传、会员无头像字段)。
- 规则:seed **不下载、不上传**媒体;`image`/`cover` 字段一律留空。图片资产迁移属 Issue #5(部署/存储)或单独的图片资产工单。
- 后续若 `data/*.js` 出现 `http(s)://` 图片,**保留 URL 字符串到备注字段而不是尝试入库到 `media`**——媒体需要走 Payload 上传流程并生成多尺寸,不能由 seed 模拟。

## 6. 演示/测试数据

- `ROSTER` 中 `demo: true` 的 118 条**不进入 `seed-content.ts`**。
- 若需要本地预览"上百会员"的 UI 效果,新建 `server/scripts/seed-demo.ts`(独立命令,如 `npm run seed:demo`),只在 `NODE_ENV=development` 且 `ALLOW_DEMO_SEED=1` 时执行,并将数据写入 `_status=draft` 或专门的 `demo` 标记字段。
- 生产环境**禁止** `seed:demo`。

## 7. 验收(迁移后如何验证前端没丢数据)

迁移完成 = 下面每一项通过。自动化优先;没写测试前手工跑:

1. **计数核对**:对每类资源比对 seed 输入数量与 Payload `find` 返回的 `published` 数量,输出表格(写入迁移日志或 CI artifact)。
   - `departments=4`, `council-members=5`, `studios=2`, `projects=4`, `events=4`, `notes=NOTES.length`, `wall-entries=10`(7 published + 3 draft), `members=6 published`, `site-settings` 非空。
2. **字段非空校验**:对每条已发布记录,断言契约中"必填"字段非空(参考 `docs/api/public-rest-api.md` 各小节示例)。
3. **前端联调对照表**:在前端切换 API 后,逐页面人工核对 `docs/api/public-rest-api.md` §13 的映射表——每行至少要看到一个真实数据渲染成功。
4. **占位可见性**:后台确认 `待公布`/`待补充` 项是 `draft`;公开 API `/api/public/*` 响应中**不出现**这些字符串。
5. **幂等回归**:`npm run seed` 连跑两次,各集合 `totalDocs` 不变,且后台手工改过的字段不被回写(§4)。

## 8. 后续要走实现的差异清单

- [ ] `seed-content.ts`:命中已有记录时省略 `_status`,避免回写管理员改过的发布状态。
- [ ] `seed-content.ts`:`WALL` 后 3 条"待补充" 应写入 `_status=draft` 而不是 published。
- [ ] `seed-content.ts`:`members` upsert 跳过 `demo: true` 已实现;需补 `featured` 规则(前 6 条 `featured=true`,真实数据后续由后台控制)。
- [ ] 新增 `seed:demo`(可选)与 `npm run verify:migration` 计数核对脚本。

## 9. 不做的事

- 不在本策略里定义新闻文章的内容迁移(沿用已有 `articles` 后台导入流程,与 `migrate:directus` 脚本同套路)。
- 不定义 CI 里自动跑 seed——seed 是一次性运维动作,CI 只做"seed 可执行性"冒烟(可选)。
- 不接管前端何时切换到 API——那是 Issue #7 的事。
