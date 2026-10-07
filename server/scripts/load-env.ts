// 在任何 import payload.config 之前必须先跑;单独成文件保证 ESM 求值顺序
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// @next/env 是 CJS,tsx ESM 下走 createRequire 最稳
require('@next/env').loadEnvConfig(process.cwd())
