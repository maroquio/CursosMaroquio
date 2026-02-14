#!/usr/bin/env bun
/**
 * List all lessons in the HTML course to check slugs
 */

import { eq } from 'drizzle-orm';
import { getDatabase } from '../src/infrastructure/database/connection.ts';
import { coursesTable, modulesTable, lessonsTable } from '../src/contexts/courses/infrastructure/persistence/drizzle/schema.ts';

async function listLessons(): Promise<void> {
  const db = getDatabase();

  const courseResult = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, 'html-essencial'))
    .limit(1);

  if (courseResult.length === 0) {
    console.log('Course not found');
    return;
  }

  const modules = await db
    .select()
    .from(modulesTable)
    .where(eq(modulesTable.courseId, courseResult[0]!.id))
    .orderBy(modulesTable.order);

  for (const module of modules) {
    console.log(`\n📁 Module: ${module.title}`);

    const lessons = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.moduleId, module.id))
      .orderBy(lessonsTable.order);

    for (const lesson of lessons) {
      console.log(`  - ${lesson.title} (slug: ${lesson.slug})`);
    }
  }
}

listLessons()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
