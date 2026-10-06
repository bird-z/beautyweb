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
      CREATE TABLE IF NOT EXISTS articles_rels (
        id serial PRIMARY KEY NOT NULL,
        "order" integer,
        parent_id integer NOT NULL,
        path varchar NOT NULL,
        categories_id integer,
        CONSTRAINT articles_rels_parent_fk
          FOREIGN KEY (parent_id) REFERENCES articles(id) ON DELETE CASCADE,
        CONSTRAINT articles_rels_categories_fk
          FOREIGN KEY (categories_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS articles_rels_order_idx
        ON articles_rels USING btree ("order");
      CREATE INDEX IF NOT EXISTS articles_rels_parent_idx
        ON articles_rels USING btree (parent_id);
      CREATE INDEX IF NOT EXISTS articles_rels_path_idx
        ON articles_rels USING btree (path);
      CREATE INDEX IF NOT EXISTS articles_rels_categories_id_idx
        ON articles_rels USING btree (categories_id);

      CREATE TABLE IF NOT EXISTS _articles_v_rels (
        id serial PRIMARY KEY NOT NULL,
        "order" integer,
        parent_id integer NOT NULL,
        path varchar NOT NULL,
        categories_id integer,
        CONSTRAINT _articles_v_rels_parent_fk
          FOREIGN KEY (parent_id) REFERENCES _articles_v(id) ON DELETE CASCADE,
        CONSTRAINT _articles_v_rels_categories_fk
          FOREIGN KEY (categories_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS _articles_v_rels_order_idx
        ON _articles_v_rels USING btree ("order");
      CREATE INDEX IF NOT EXISTS _articles_v_rels_parent_idx
        ON _articles_v_rels USING btree (parent_id);
      CREATE INDEX IF NOT EXISTS _articles_v_rels_path_idx
        ON _articles_v_rels USING btree (path);
      CREATE INDEX IF NOT EXISTS _articles_v_rels_categories_id_idx
        ON _articles_v_rels USING btree (categories_id);
    `,
  )

  await query(
    payload,
    `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'articles'
            AND column_name = 'category_id'
        ) THEN
          INSERT INTO articles_rels ("order", parent_id, path, categories_id)
          SELECT 1, article.id, 'category', article.category_id
          FROM articles AS article
          WHERE article.category_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM articles_rels AS relation
              WHERE relation.parent_id = article.id
                AND relation.path = 'category'
                AND relation.categories_id = article.category_id
            );
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = '_articles_v'
            AND column_name = 'version_category_id'
        ) THEN
          INSERT INTO _articles_v_rels ("order", parent_id, path, categories_id)
          SELECT 1, article_version.id, 'version.category', article_version.version_category_id
          FROM _articles_v AS article_version
          WHERE article_version.version_category_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM _articles_v_rels AS relation
              WHERE relation.parent_id = article_version.id
                AND relation.path = 'version.category'
                AND relation.categories_id = article_version.version_category_id
            );
        END IF;
      END
      $$;

      ALTER TABLE IF EXISTS articles
        DROP COLUMN IF EXISTS category_id;

      ALTER TABLE IF EXISTS _articles_v
        DROP COLUMN IF EXISTS version_category_id;
    `,
  )
}

export async function down({ payload }: MigrationArgs): Promise<void> {
  await query(
    payload,
    `
      ALTER TABLE IF EXISTS articles
        ADD COLUMN IF NOT EXISTS category_id integer;

      ALTER TABLE IF EXISTS _articles_v
        ADD COLUMN IF NOT EXISTS version_category_id integer;

      UPDATE articles AS article
      SET category_id = relation.categories_id
      FROM (
        SELECT DISTINCT ON (parent_id) parent_id, categories_id
        FROM articles_rels
        WHERE path = 'category'
        ORDER BY parent_id, "order" ASC NULLS LAST, id ASC
      ) AS relation
      WHERE relation.parent_id = article.id;

      UPDATE _articles_v AS article_version
      SET version_category_id = relation.categories_id
      FROM (
        SELECT DISTINCT ON (parent_id) parent_id, categories_id
        FROM _articles_v_rels
        WHERE path = 'version.category'
        ORDER BY parent_id, "order" ASC NULLS LAST, id ASC
      ) AS relation
      WHERE relation.parent_id = article_version.id;

      ALTER TABLE articles
        ADD CONSTRAINT articles_category_fk
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

      ALTER TABLE _articles_v
        ADD CONSTRAINT _articles_v_version_category_fk
        FOREIGN KEY (version_category_id) REFERENCES categories(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS articles_category_idx
        ON articles USING btree (category_id);
      CREATE INDEX IF NOT EXISTS _articles_v_version_version_category_idx
        ON _articles_v USING btree (version_category_id);

      DROP TABLE IF EXISTS articles_rels;
      DROP TABLE IF EXISTS _articles_v_rels;
    `,
  )
}
