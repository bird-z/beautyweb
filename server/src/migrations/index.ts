import * as migration_20260624_183000_article_metadata_fields from './20260624_183000_article_metadata_fields'
import * as migration_20260624_193000_article_source_field from './20260624_193000_article_source_field'
import * as migration_20260624_204800_article_source_admin_field from './20260624_204800_article_source_admin_field'
import * as migration_20260720_041800_article_categories_has_many from './20260720_041800_article_categories_has_many'

export const migrations = [
  {
    up: migration_20260624_183000_article_metadata_fields.up,
    down: migration_20260624_183000_article_metadata_fields.down,
    name: '20260624_183000_article_metadata_fields',
  },
  {
    up: migration_20260624_193000_article_source_field.up,
    down: migration_20260624_193000_article_source_field.down,
    name: '20260624_193000_article_source_field',
  },
  {
    up: migration_20260624_204800_article_source_admin_field.up,
    down: migration_20260624_204800_article_source_admin_field.down,
    name: '20260624_204800_article_source_admin_field',
  },
  {
    up: migration_20260720_041800_article_categories_has_many.up,
    down: migration_20260720_041800_article_categories_has_many.down,
    name: '20260720_041800_article_categories_has_many',
  },
]
