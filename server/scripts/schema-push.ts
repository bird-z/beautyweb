// 生产首部署:对全新库做一次 drizzle push 建全量表
// 用法:PAYLOAD_DB_PUSH=1 tsx scripts/schema-push.ts(DATABASE_URL 指向目标库)
// 之后立即 `payload migrate` 把历史增量迁移标记为已执行
import './load-env'

import config from '../src/payload.config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
payload.logger.info('schema push finished')
await payload.db.destroy?.()
