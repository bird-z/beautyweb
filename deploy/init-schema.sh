#!/bin/sh
# 在 payload/migrator 镜像容器内执行(deps 已按 lock 装好)
# step1: tsx 脚本 push 全量建表   step2: payload migrate 标记历史迁移为已执行
set -euo pipefail
cd /app

echo '[init-schema] step 1: drizzle push -> create all tables'
PAYLOAD_DB_PUSH=1 npx tsx scripts/schema-push.ts

echo '[init-schema] step 2: payload migrate (records 4 incremental migrations as ran, batch -1)'
PAYLOAD_DB_PUSH=0 npx payload migrate

echo '[init-schema] done'
