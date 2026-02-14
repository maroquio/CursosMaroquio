import { pgTable, text, timestamp, index, integer, boolean, varchar, unique, real } from 'drizzle-orm/pg-core';

export const llmManufacturersTable = pgTable(
  'llm_manufacturers',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_llm_manufacturers_slug').on(table.slug),
    index('idx_llm_manufacturers_name').on(table.name),
  ]
);

export type LlmManufacturerSchema = typeof llmManufacturersTable.$inferSelect;
export type LlmManufacturerInsert = typeof llmManufacturersTable.$inferInsert;

export const llmModelsTable = pgTable(
  'llm_models',
  {
    id: text('id').primaryKey().notNull(),
    manufacturerId: text('manufacturer_id')
      .notNull()
      .references(() => llmManufacturersTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    technicalName: varchar('technical_name', { length: 200 }).notNull().unique(),
    pricePerMillionInputTokens: real('price_per_million_input_tokens').notNull().default(0),
    pricePerMillionOutputTokens: real('price_per_million_output_tokens').notNull().default(0),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_llm_models_manufacturer_id').on(table.manufacturerId),
    index('idx_llm_models_technical_name').on(table.technicalName),
    index('idx_llm_models_is_default').on(table.isDefault),
  ]
);

export type LlmModelSchema = typeof llmModelsTable.$inferSelect;
export type LlmModelInsert = typeof llmModelsTable.$inferInsert;
