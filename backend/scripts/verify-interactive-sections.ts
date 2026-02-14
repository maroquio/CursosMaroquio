#!/usr/bin/env bun
/**
 * Verify that interactive sections were created successfully
 */

import { eq, sql } from 'drizzle-orm';
import { getDatabase } from '../src/infrastructure/database/connection.ts';
import { sectionsTable, sectionBundlesTable } from '../src/contexts/courses/infrastructure/persistence/drizzle/schema.ts';

async function verify(): Promise<void> {
  const db = getDatabase();

  console.log('📊 Verifying interactive sections...\n');

  // Count sections by type
  const typeCount = await db.execute(sql`
    SELECT content_type, COUNT(*) as count
    FROM sections
    GROUP BY content_type
    ORDER BY content_type
  `) as any;

  console.log('Section types:');
  if (typeCount && Array.isArray(typeCount)) {
    for (const row of typeCount) {
      console.log(`  ${row.content_type}: ${row.count}`);
    }
  }

  // Count active bundles
  const bundleCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(sectionBundlesTable)
    .where(eq(sectionBundlesTable.isActive, true));

  console.log(`\nActive section bundles: ${bundleCount[0]?.count || 0}`);

  // List all interactive sections
  const interactiveSections = await db
    .select({
      sectionTitle: sectionsTable.title,
      storagePath: sectionBundlesTable.storagePath,
      isActive: sectionBundlesTable.isActive,
    })
    .from(sectionsTable)
    .innerJoin(sectionBundlesTable, eq(sectionsTable.id, sectionBundlesTable.sectionId))
    .where(eq(sectionsTable.contentType, 'interactive'))
    .orderBy(sectionsTable.title);

  console.log('\n✅ Interactive sections with bundles:');
  for (const section of interactiveSections) {
    const status = section.isActive ? '✓' : '✗';
    console.log(`  ${status} ${section.sectionTitle}`);
    console.log(`     Path: ${section.storagePath}`);
  }

  console.log('\n✓ Verification complete');
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Verification failed:', err);
    process.exit(1);
  });
