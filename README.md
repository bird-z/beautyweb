# BioQif Monorepo

生物启扉协会网站前后端单仓库。

## 目录

- `web/`：React + Vite 公开网站
- `server/`：Next.js + Payload CMS 后端和管理后台
- `docs/`：工程文档

## 本地开发

分别启动前端和后端：

```sh
npm run dev:server
npm run dev:web
```

默认地址：

- 前端：`http://localhost:5173`
- Payload 后端/管理后台：`http://localhost:3000`

首次启动后端前，请复制 `server/.env.example` 为 `server/.env`，填写 PostgreSQL 和 Payload 配置。

## 构建

```sh
npm run build:web
npm run build:server
```

或一次构建两个应用：

```sh
npm run build
```

## 安全

不要提交 `server/.env`、数据库密码、`PAYLOAD_SECRET` 或其他生产凭据。仓库只保留 `server/.env.example`。
