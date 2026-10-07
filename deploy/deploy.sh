#!/usr/bin/env bash
# ============================================================
# bioqif.com 部署脚本 —— 在服务器上执行
#
#   前置:docker + docker compose plugin、nginx、certbot
#         代码在 $REPO_DIR(默认 /opt/bioqif/beautyweb)
#         秘密文件 /etc/bioqif/server.env(POSTGRES_PASSWORD + PAYLOAD_SECRET)
#
#   用法:
#     ./deploy/deploy.sh init      首次部署:schema 初始化 + 标记迁移 + 起服务 + 可选 seed
#     ./deploy/deploy.sh update    日常发布:git pull + 重建 payload + 重建 web
#     ./deploy/deploy.sh seed      手动跑内容 seed(init 不自动做)
#     ./deploy/deploy.sh migrate   只跑 payload migrate(新增迁移后)
#     ./deploy/deploy.sh web       只重建前端静态文件并同步 /var/www/bioqif
#     ./deploy/deploy.sh status    健康检查
#
#   环境变量可覆盖:REPO_DIR WEB_ROOT ENV_FILE API_BASE
# ============================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/bioqif/beautyweb}"
WEB_ROOT="${WEB_ROOT:-/var/www/bioqif}"
ENV_FILE="${ENV_FILE:-/etc/bioqif/server.env}"
COMPOSE="docker compose -f $REPO_DIR/server/compose.production.yaml"
MIGRATIONS=(20260624_183000_article_metadata_fields
            20260624_193000_article_source_field
            20260624_204800_article_source_admin_field
            20260720_041800_article_categories_has_many)

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "缺少 $ENV_FILE —— 先建它(POSTGRES_PASSWORD / PAYLOAD_SECRET)"
# compose 的 ${VAR} 插值从 server/.env 读;把秘密文件链过去
[ -f "$REPO_DIR/server/.env" ] || ln -sf "$ENV_FILE" "$REPO_DIR/server/.env"
set -a; . "$ENV_FILE"; set +a

cmd_init() {
  log "0. 前置检查"
  docker info >/dev/null 2>&1 || die "docker 不可用"
  [ -n "${POSTGRES_PASSWORD:-}" ] || die "ENV_FILE 缺 POSTGRES_PASSWORD"
  [ -n "${PAYLOAD_SECRET:-}" ]  || die "ENV_FILE 缺 PAYLOAD_SECRET"

  log "1. 启动 database"
  $COMPOSE up -d database
  wait_db

  log "2. 初始化 schema(tsx push 全量建表)"
  # 构建镜像含 node_modules + 源码;直接在里面跑 init-schema
  $COMPOSE build payload
  NET="$(sudo docker inspect bioqif-payload-database --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -1)"
  docker run --rm --network "$NET" \
    -e DATABASE_URL="postgresql://bioqif_payload:${POSTGRES_PASSWORD}@database:5432/bioqif_payload" \
    -e PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
    -e NEXT_PUBLIC_SERVER_URL="https://manage.bioqif.com" \
    -e PAYLOAD_DB_PUSH=1 \
    -v "$REPO_DIR/deploy/init-schema.sh:/init-schema.sh:ro" \
    "$(docker compose -f "$REPO_DIR/server/compose.production.yaml" images -q payload)" \
    bash /init-schema.sh || warn "push 步骤失败?看上面日志;若表已存在属正常"

  log "3. 标记历史增量迁移为已执行(幂等)"
  for m in "${MIGRATIONS[@]}"; do
    $COMPOSE exec -T database psql -U bioqif_payload -d bioqif_payload -c \
      "INSERT INTO payload_migrations (name, batch) VALUES ('$m', -1) ON CONFLICT DO NOTHING;" \
      >/dev/null || warn "标记 $m 失败(可能已存在,忽略)"
  done

  log "4. 启动 payload"
  $COMPOSE up -d payload
  sleep 3
  cmd_status || warn "payload 还没起来,看: $COMPOSE logs -f payload"

  warn "首次部署还差:① admin 账号(https://manage.bioqif.com/admin 注册) ② './deploy/deploy.sh seed' 灌初始内容 ③ nginx + certbot(见 deploy/nginx/bioqif.conf) ④ web 构建 './deploy/deploy.sh web'"
}

cmd_update() {
  log "git pull"
  git -C "$REPO_DIR" pull --ff-only
  log "重建并重启 payload"
  $COMPOSE build payload
  $COMPOSE up -d payload
  log "迁移(有新迁移才需要)"
  $COMPOSE run --rm --no-deps \
    -e DATABASE_URL="postgresql://bioqif_payload:${POSTGRES_PASSWORD}@database:5432/bioqif_payload" \
    -e PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
    -e PAYLOAD_DB_PUSH=0 \
    payload npx payload migrate || warn "migrate 失败或没有新迁移"
  cmd_web
  cmd_status
}

cmd_seed() {
  log "内容 seed(幂等 upsert)"
  NET="$(sudo docker inspect bioqif-payload-database --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -1)"
  docker run --rm --network "$NET" \
    -e DATABASE_URL="postgresql://bioqif_payload:${POSTGRES_PASSWORD}@database:5432/bioqif_payload" \
    -e PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
    -e NEXT_PUBLIC_SERVER_URL="https://manage.bioqif.com" \
    -e PAYLOAD_DB_PUSH=0 \
    "$(docker compose -f "$REPO_DIR/server/compose.production.yaml" images -q payload)" \
    npx tsx scripts/seed-content.ts
}

cmd_migrate() {
  $COMPOSE run --rm --no-deps \
    -e DATABASE_URL="postgresql://bioqif_payload:${POSTGRES_PASSWORD}@database:5432/bioqif_payload" \
    -e PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
    -e PAYLOAD_DB_PUSH=0 \
    payload npx payload migrate
}

cmd_web() {
  log "构建 web 静态文件"
  (cd "$REPO_DIR/web" && npm ci && npm run build)
  mkdir -p "$WEB_ROOT"
  rsync -av --delete "$REPO_DIR/web/dist/" "$WEB_ROOT/"
  log "web 已同步到 $WEB_ROOT"
}

cmd_status() {
  log "容器状态"
  $COMPOSE ps
  log "健康检查"
  curl -sf http://127.0.0.1:3000/api/health && echo || warn "payload 未就绪"
  curl -sf https://manage.bioqif.com/api/health >/dev/null 2>&1 && echo "manage.bioqif.com OK" || warn "manage.bioqif.com 未通(nginx/证书还没配?)"
}

wait_db() {
  log "等待 postgres healthy"
  for i in $(seq 1 30); do
    $COMPOSE exec -T database pg_isready -U bioqif_payload -d bioqif_payload >/dev/null 2>&1 && return 0
    sleep 2
  done
  die "postgres 30s 未就绪"
}

case "${1:-}" in
  init)    cmd_init ;;
  update)  cmd_update ;;
  seed)    cmd_seed ;;
  migrate) cmd_migrate ;;
  web)     cmd_web ;;
  status)  cmd_status ;;
  *) sed -n '2,20p' "$0"; exit 1 ;;
esac
