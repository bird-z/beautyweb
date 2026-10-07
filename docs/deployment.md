# 生产部署与环境拓扑

本文档回答 Issue #5。前提:**没有 Fastify**——后端就是 `server/` 里的 Next.js + Payload(路线图上"Fastify"是旧提法,已被 #9 的单仓库决策取代)。

状态:草案 v1。

## 1. 拓扑

```
                 ┌──────────────────────────┐
                 │   Nginx / 反向代理        │
                 │   bioqif.com (web)       │
                 │   manage.bioqif.com      │   ←── admin / API
                 └──────┬───────────┬───────┘
                        │           │
              静态文件    │           │   proxy_pass http://127.0.0.1:3000
              (web/dist)│           │
                        │     ┌─────▼──────────────┐
                        │     │  payload (Next.js) │ :3000 (loopback only)
                        │     │  - /admin          │
                        │     │  - /api/*          │
                        │     │  - /api/public/*   │
                        │     └─────┬──────────────┘
                        │           │ DATABASE_URL
                        │     ┌─────▼──────────────┐
                        │     │  postgres:16       │ :5432 (container net only)
                        │     └────────────────────┘
```

- **web**:`web/` 用 Vite 构建成静态文件,直接由 Nginx 服务,不走 Node。
- **server**:`server/Dockerfile` 已产出 standalone Next.js;`compose.production.yaml` 里有 `database`/`payload`/`migrate` 三个服务,**沿用不拆**。
- **域名**:公开站 `bioqif.com` / `www.bioqif.com`;后台 + API `manage.bioqif.com`(与 `payload.config.ts` 的 `csrf` 白名单一致);`cms.bioqif.com` 保留给旧 Directus,过渡期并存。

## 2. 域名与路由规则

| Host | 目标 | 说明 |
| --- | --- | --- |
| `bioqif.com`, `www.bioqif.com` | `web/dist` 静态 | SPA fallback `try_files $uri /index.html`;静态资源 `Cache-Control: public, max-age=31536000, immutable`(带 hash);`index.html` `no-store` |
| `manage.bioqif.com` | `127.0.0.1:3000` | `proxy_pass`;`/admin`、`/api/*`、`/api/public/*` 全走这里 |
| `cms.bioqif.com` | 旧 Directus | 过渡期内不动,等 `migrate:directus` + 前端切换完成后下线 |

**前端 → API**:`VITE_API_BASE=https://manage.bioqif.com`(与契约 §0.1 一致);不走同域反代,避免 `bioqif.com` 的 cookie/CORS 与 admin 混淆。

## 3. CORS / CSRF / HTTPS

- **CORS**(已在 `payload.config.ts` 声明,保持不变):允许 `bioqif.com`、`www.bioqif.com`、本地 `5173/8000-8002`。**不**加 `manage.bioqif.com`——公开 API 只被 `bioqif.com` 的前端调用,admin 自身是同源。
- **CSRF**:沿用现有 `csrf` 白名单(`cms.bioqif.com`/`manage.bioqif.com` + localhost)。
- **HTTPS**:全部走 Nginx + Let's Encrypt(`certbot`);`manage.bioqif.com` 单独证书;HSTS `max-age=31536000` 仅加在 `bioqif.com`,manage 域先不加(避免误伤子域)。
- **Headers**(Nginx 统一加):`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`(web)、`Referrer-Policy: strict-origin-when-cross-origin`;`Content-Security-Policy` 留给 Issue #8 之后单独收敛(需要先把前端第三方资源列清楚)。

## 4. 环境变量

### `server/.env.production`(不进 git)

```env
DATABASE_URL=postgresql://bioqif_payload:<pwd>@database:5432/bioqif_payload
PAYLOAD_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SERVER_URL=https://manage.bioqif.com
POSTGRES_PASSWORD=<同 DATABASE_URL 中的 pwd>
DIRECTUS_URL=https://cms.bioqif.com   # 过渡期,迁移完成后删除
```

### `web/.env.production`(可以进 git)

```env
VITE_API_BASE=https://manage.bioqif.com
```

**红线**(README 已有,此处重申):
- `.env`、`.env.local`、`POSTGRES_PASSWORD`、`PAYLOAD_SECRET`、`DATABASE_URL` 一律不提交。
- 仓库只留 `.env.example`。
- 生产 `.env` 文件放部署机的 `/etc/bioqif/server.env`,权限 `600`,owner `root`;compose 用 `env_file` 引用。

## 5. 启动与迁移

```bash
# 部署机
cd /opt/bioqif/beautyweb
docker compose -f server/compose.production.yaml pull
docker compose -f server/compose.production.yaml up -d database
docker compose -f server/compose.production.yaml --profile migration run --rm migrate   # 跑一次
docker compose -f server/compose.production.yaml up -d payload
# web
cd web && npm ci && npm run build && rsync -av dist/ /var/www/bioqif/
```

- **DB 迁移**:`payload migrate`(已有 `migrate` script);**不**自动跑——发布流程里显式触发,失败要能让人看到。
- **Seed**:`npm run seed` 只在首次部署/重置环境时手动跑;不进 compose `up` 的默认链。
- **健康检查**:`payload` 容器已有 postgres `pg_isready`;给 Next.js 加一个轻量 `GET /api/health`(返回 `{ok:true}`)供 Nginx `proxy_next_upstream`/监控探活——这一项在实现阶段补(当前没有该路由)。
- **启动顺序**:`database` healthy → `migrate`(可选)→ `payload` → Nginx reload。

## 6. 日志 / 备份 / 监控

| 项 | 方案(第一阶段) |
| --- | --- |
| 应用日志 | `docker compose logs -f payload`;落盘 `journald`,保留 14 天 |
| Nginx 日志 | `access.log`/`error.log` 默认;`manage.bioqif.com` 单独 log 文件便于审计 admin 访问 |
| 数据库备份 | 每日 `pg_dump` → `/var/backups/bioqif/postgres/<date>.sql.gz`,保留 14 份;异机拷贝交给 Issue #5 之后 |
| 媒体备份 | `/var/lib/bioqif-payload/media` 每周 `rsync` 到备份目录,保留 4 周 |
| 监控 | 第一阶段:**Uptime Robot 类外部探活** `https://bioqif.com` + `https://manage.bioqif.com/api/health`,5 分钟间隔;失败邮件/webhook |
| 限流 | 公开 `POST /api/public/join-applications` 走契约 §9 的应用层 3 req/min/IP;Nginx 层暂不配 `limit_req` |

> 对象存储/CDN:`media` 先走本地卷 + Nginx `proxy_cache`(可选优化);接入 S3/Cloudflare R2 属后续单独工单,本阶段不承诺。

## 7. 第一阶段不做的事

- 不上 Kubernetes / swarm;`docker compose` 足够。
- 不做多副本/蓝绿;`payload` 单容器,发布 = `docker compose up -d --build payload`,允许秒级中断。
- 不动 `cms.bioqif.com` 的旧 Directus,直到 `migrate:directus` 验收完成。
- 不在本文件里定义 CI/CD pipeline——那是 Issue #8。

## 8. 公开端口与暴露面

- `payload` 只绑 `127.0.0.1:3000`(compose 已配);`database` 不暴露主机端口。
- `manage.bioqif.com/admin` 由 Payload 自带 admin 提供;**不**做 IP 白名单(第一阶段),但要求 admin 强密码 + 后续考虑加 Nginx `auth_request` 双因子。

## 9. 与路线图其他决策的衔接

- 契约:`docs/api/public-rest-api.md` §0.1 `VITE_API_BASE=https://manage.bioqif.com` ↔ 本文档 §4。
- 迁移:`docs/api/data-migration.md` §7 验收要在 `manage.bioqif.com` 上跑一次。
- 前端:`docs/api/web-data-access.md` §2 `VITE_API_BASE` 从构建期注入,运行时不可改。
- 认证与权限边界(Issue #6):本文件只定网络边界;admin/editor 的角色、能否跨域调 admin API 属 #6。
