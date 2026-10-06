# BioQif Payload CMS

面向协会内容运营者的 Payload CMS 后台。

## 本地启动

1. 复制 `.env.example` 为 `.env`。
2. 准备 PostgreSQL 数据库并填写 `DATABASE_URL`。
3. 执行 `npm install`。
4. 执行 `npm run dev`。
5. 打开 `http://localhost:3000/admin` 创建首位管理员。

## 生产部署

生产环境使用 `compose.production.yaml`。Payload 与旧 Directus 应先并行运行，
完成数据迁移和前端验证后再切换 Nginx。
