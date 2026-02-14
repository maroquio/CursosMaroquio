#!/usr/bin/env bun
/**
 * Temporary script to add 'interactive' value to section_content_type enum.
 */

import { sql } from 'drizzle-orm';
import { getDatabase } from '../src/infrastructure/database/connection.ts';

async function addInteractiveType(): Promise<void> {
  const db = getDatabase();

  console.log('Adding \'interactive\' to section_content_type enum...');

  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = 'section_content_type'::regtype
          AND enumlabel = 'interactive'
        ) THEN
          ALTER TYPE section_content_type ADD VALUE 'interactive';
        END IF;
      END $$;
    `);

    console.log('✓ Successfully added \'interactive\' to section_content_type enum');
  } catch (error) {
    console.error('✗ Error adding enum value:', error);
    throw error;
  }
}

// Run the script
addInteractiveType()
  .then(() => {
    console.log('✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  });
