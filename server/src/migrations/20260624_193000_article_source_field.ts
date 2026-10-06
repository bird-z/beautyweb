import type { Payload } from 'payload'

type MigrationArgs = {
  payload: Payload
}

async function query(payload: Payload, statement: string) {
  await (payload.db as any).pool.query(statement)
}

export async function up({ payload }: MigrationArgs): Promise<void> {
  await query(
    payload,
    `
      ALTER TABLE IF EXISTS articles
        ADD COLUMN IF NOT EXISTS source varchar;
    `,
  )

  await query(
    payload,
    `
      ALTER TABLE IF EXISTS _articles_v
        ADD COLUMN IF NOT EXISTS version_source varchar;
    `,
  )
}

export async function down({ payload }: MigrationArgs): Promise<void> {
  await query(
    payload,
    `
      ALTER TABLE IF EXISTS _articles_v
        DROP COLUMN IF EXISTS version_source;
    `,
  )

  await query(
    payload,
    `
      ALTER TABLE IF EXISTS articles
        DROP COLUMN IF EXISTS source;
    `,
  )
}
