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
        ADD COLUMN IF NOT EXISTS author varchar,
        ADD COLUMN IF NOT EXISTS editor varchar,
        ADD COLUMN IF NOT EXISTS reviewer varchar;
    `,
  )

  await query(
    payload,
    `
      ALTER TABLE IF EXISTS _articles_v
        ADD COLUMN IF NOT EXISTS version_author varchar,
        ADD COLUMN IF NOT EXISTS version_editor varchar,
        ADD COLUMN IF NOT EXISTS version_reviewer varchar;
    `,
  )
}

export async function down({ payload }: MigrationArgs): Promise<void> {
  await query(
    payload,
    `
      ALTER TABLE IF EXISTS _articles_v
        DROP COLUMN IF EXISTS version_reviewer,
        DROP COLUMN IF EXISTS version_editor,
        DROP COLUMN IF EXISTS version_author;
    `,
  )

  await query(
    payload,
    `
      ALTER TABLE IF EXISTS articles
        DROP COLUMN IF EXISTS reviewer,
        DROP COLUMN IF EXISTS editor,
        DROP COLUMN IF EXISTS author;
    `,
  )
}
