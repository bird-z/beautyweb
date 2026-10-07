# 管理后台认证与权限边界

本文档回答 Issue #6:第一阶段**不实现新登录**,但要锁死"未来接入管理后台不能靠重写公开 API"的扩展点。现状:Payload 自带 `auth: true` + `role: admin|editor`,公开访问由 `access.ts` 里的 `authenticated`/`adminsOnly`/`publishedOrAuthenticated` 三个谓词控制。

状态:草案 v1。

## 1. 认证方式

- **沿用 Payload 自带认证**:`users` 集合 `auth: true`,cookie + CSRF token;**不**引入外部 IdP,**不**给公开站加登录。
- **后台 URL**:`https://manage.bioqif.com/admin`(与 `docs/deployment.md` §2 一致);登录页用 Payload 默认 UI,不自定义。
- **会话**:Payload 默认 JWT cookie;`csrf` 白名单沿用 `payload.config.ts`。
- **首 admin 创建**:`/admin` 首次启动时通过 Payload 引导界面创建(README 已有);之后的用户必须由已登录 admin 在后台创建,**关闭公开注册**(Payload 默认就关,只要没人加 `useAPIKey`/`disableLocalStrategy:false` 的开放注册端点)。

## 2. 角色模型

只用 Payload 现有两个角色;**不**新增 `member`、`viewer`、`contributor` 等第三阶段角色。

| 角色 | 能做什么 | 不能做什么 |
| --- | --- | --- |
| `admin` | 全部集合 CRUD、`users` 管理、`join-applications` 读/删、`site-settings` 改 | — |
| `editor` | `articles`/categories/media` + 协会内容集合(`departments`/`council-members`/`studios`/`projects`/`events`/`members`/`wall-entries`/`notes`)的 create/read/update;`join-applications` **不可读**(只能看自己提交的——但 editor 不通过后台提交,实际是"看不到");`site-settings` 不可改;`users` 只能改自己 | 删 `join-applications`、改别人用户、改 `users.role`、改 `site-settings` |

> **现状检查**:`access.ts` 已经实现上表的一半——`authenticated` 给 editor 全部写权限、`adminsOnly` 给 join-applications 读删。**editor 没有"只能看不能写"的限制**;如果未来要拆 `editor` vs `publisher`,先加新角色而不是改 `authenticated` 语义。

## 3. 资源级权限矩阵

每集合锁定如下(与 `server/src/collections/*.ts` 现状对齐;差异列在 §7):

| Collection | create | read | update | delete |
| --- | --- | --- | --- | --- |
| `users` | `adminsOnly` | `adminsOnly` 或 self | `adminsOnly` 或 self(不能改 `role`) | `adminsOnly` |
| `articles` | `authenticated` | `publishedOrAuthenticated` | `authenticated` | `authenticated` |
| `categories` | `authenticated` | 公开读(各文章嵌入) | `authenticated` | `authenticated` |
| `media` | `authenticated` | 公开读(URL 是公开资产) | `authenticated` | `authenticated` |
| `departments`/`council-members`/`studios`/`projects`/`events`/`members`/`wall-entries`/`notes` | `authenticated` | `publishedOrAuthenticated` | `authenticated` | `authenticated` |
| `join-applications` | **anonymous ok**(公开表单) | `adminsOnly` | `authenticated`(只能改 `status`) | `adminsOnly` |
| `site-settings` global | — | 公开读 | `authenticated` | — |

**关键约束**:
- `join-applications` 的 `create: () => true` 是刻意的——公开表单必须匿名可写;`read`/`delete` 收给 `adminsOnly` 守住隐私。
- 任何集合**不**允许 `read: () => true` 用于含隐私字段的表——`members` 没有隐私字段(只展示用),`join-applications` 有。
- `_status=draft` 对匿名不可见已由 `publishedOrAuthenticated` 保证;**测试覆盖**(`docs/testing.md` §4 `access.test.ts`)。

## 4. 加入申请隐私边界

- 字段 `contact`(联系方式)、`message`(申请理由)是**敏感个人信息**。
- **公开 API**:契约 §9 只暴露 `POST`,不返回任何已存数据;`GET /api/public/join-applications` 不存在;Payload 内置 `/api/join-applications` 由 `read: adminsOnly` 兜底(未登录 → `forbidden`)。
- **后台可见性**:仅 `admin`;`editor` 不能看(避免把申请人联系方式暴露给所有内容编辑)。
- **导出**:第一阶段不提供导出/邮件通知;若未来要导出,走 admin 手工导出,不建 API 端点。

## 5. 公开内容发布权限

- `_status` 只有两个值:`draft`(仅登录可见)/`published`(公开)。
- **谁能发布**:当前 `authenticated` 即可——editor 也能直接发布。第一阶段接受这个简化;如果之后要"editor 起草、admin 发布",新增 `publisher` 角色并给 `_status` 字段加 `access.update`,**不**改 `authenticated` 语义。
- **删除**:与 update 同权限(`authenticated`)。重要内容(articles/join-applications)删除前 admin 手工备份——`docs/testing.md` §8 CI 不覆盖删除路径。

## 6. 审计与变更追溯

- **版本历史**:所有内容集合已配 `versions.drafts: true, maxPerDoc: 20`;文章 `maxPerDoc: 30` 带 `autosave/schedulePublish`——保留,够用。
- **操作日志**:第一阶段**不**新增审计集合;Payload 自带 `versions` + `_status` 已能回答"谁最后改过什么";未来若需详细 audit log,加 `audit-logs` collection + `afterChange` hook,**不动现有 access 函数签名**。
- **登录审计**:依赖 Nginx `manage.bioqif.com` 单独 access log(`docs/deployment.md` §6)。

## 7. 扩展点(为未来预留,但不实现)

以下都是"加而不改"的挂点,确保未来接入不重写现有代码:

| 未来需求 | 扩展方式 |
| --- | --- |
| 新增角色 `publisher` | `Users.fields.role.options` 加值;`access.ts` 加 `publishersOnly`;集合逐项切换 |
| OAuth/SSO 登录 | Payload `auth.strategies` 加 provider;不替换 `auth: true` |
| API token 服务化调用 | `users` 集合 `useAPIKey: true`;**不**允许公开调用方共用 admin session |
| Editor 细粒度字段权限 | 用字段级 `access.update` 回调;不动集合级 |
| 操作审计 | 新增 `audit-logs` 集合 + `afterChange` hook |
| 邀请制注册 | 新增 `invites` collection + `beforeCreate` 校验 token |

## 8. 第一阶段明确不做

- 不实现验证码/图形验证(限流靠契约 §9 的 IP 节流)。
- 不做邮件验证/忘记密码——admin 走的是 Nginx 后的 Payload 默认 reset 链接,由 `manage.bioqif.com` 域名下的 SMTP 配置承担(具体 SMTP 属部署工单)。
- 不做成员自助编辑自己的 `members` 档案——会员档案由 editor 维护,登录用户不绑定 `members` 文档。
- 不在公开 API 上挂 admin session(防 cookie 泄露:`Access-Control-Allow-Credentials` 不加)。

## 9. 与现有实现的差异

当前 `access.ts`/`payload.config.ts` 与本策略唯一需要确认的差异:

- `join-applications.access.update` 当前是 `authenticated`(editor 也能改状态)。**保留**——editor 改处理状态是合理工作流;但 `read`/`delete` 仍 `adminsOnly` 守住隐私。
- `users.role` 的 `access.update` 已限 `adminsOnly`,防止 editor 自我提权——保持。
- `categories`/`media` 的 `access.read: () => true` 已核对,**是有意的**——文章 embed 需要读分类名、前端 `<img>` 需要公开访问 media URL;两个集合都不含敏感字段(`categories` 只存 name/slug/sort,`media` 的 filename/filesize 属于公开资产元数据),可保留 `() => true`。**约束**:未来给 `media` 加字段时不要把内部存储 key、签名 URL 等敏感字段塞进来。

## 10. 验收锚点

- [ ] 匿名 `POST /api/join-applications` 能建;匿名 `GET /api/join-applications` 返回 401/403。
- [ ] editor 登录后 `read join-applications` → 403;admin → 200。
- [ ] editor 改自己的 `users` 记录成功、改 `role` 被拒、改别人被拒。
- [ ] `_status=draft` 的 `members`/`notes` 匿名 GET 不到。
- [ ] 公开 API 响应里不出现 `req.user`/`email`/`contact` 等字段(已由契约测试覆盖)。
