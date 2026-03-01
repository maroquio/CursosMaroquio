import { eq } from 'drizzle-orm';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { getDatabase } from '../connection.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  categoriesTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { usersTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { env } from '@shared/config/env.ts';
import { v7 as uuidv7 } from 'uuid';

// ---------------------------------------------------------------------------
// JSON module data types (mirrors /content/css/*.json structure)
// ---------------------------------------------------------------------------
interface SectionData {
  title: string;
  contentType: 'text' | 'exercise' | 'quiz';
  order: number;
  content: Record<string, unknown>;
}

interface LessonData {
  title: string;
  slug: string;
  description?: string;
  type: 'text' | 'video' | 'quiz' | 'assignment';
  isFree?: boolean;
  order: number;
  sections: SectionData[];
}

interface ModuleJsonData {
  title: string;
  description?: string;
  order: number;
  lessons: LessonData[];
}

async function loadModuleFiles(): Promise<ModuleJsonData[]> {
  const contentDir = join(import.meta.dir, '../../../../../..', 'content', 'css');
  const files = [
    'modulo-01-fundamentos.json',
    'modulo-02-box-model.json',
    'modulo-03-tipografia.json',
    'modulo-04-cores-fundos.json',
    'modulo-05-flexbox.json',
    'modulo-06-grid.json',
    'modulo-07-posicionamento.json',
    'modulo-08-responsividade.json',
    'modulo-09-transicoes-animacoes.json',
    'modulo-10-tecnicas-avancadas.json',
  ];

  const modules: ModuleJsonData[] = [];
  for (const file of files) {
    const path = join(contentDir, file);
    try {
      const data = await Bun.file(path).json();
      modules.push(data as ModuleJsonData);
    } catch {
      if (env.NODE_ENV !== 'test')
        console.warn(`  ⚠ Could not load ${file}, skipping`);
    }
  }
  return modules;
}

async function copyCourseThumbnail(sourceName: string, destName: string): Promise<string | null> {
  try {
    const THUMBNAILS_DIR = './uploads/thumbnails';
    await mkdir(THUMBNAILS_DIR, { recursive: true });
    const sourcePath = join(import.meta.dir, 'assets', sourceName);
    const destPath = join(THUMBNAILS_DIR, destName);
    if (!await Bun.file(destPath).exists()) {
      await Bun.write(destPath, Bun.file(sourcePath));
    }
    return `/uploads/thumbnails/${destName}`;
  } catch {
    console.warn(`  ⚠ Could not copy thumbnail ${sourceName}, skipping`);
    return null;
  }
}

/**
 * Seed function: create CSS Essencial course with modules, lessons and sections
 * Idempotent — skips if the course already exists.
 */
export async function seedCssCourse(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // 1. Find admin user (instructor)
  const adminResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, 'ricardo@maroquio.com'))
    .limit(1);

  if (adminResult.length === 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  ⚠ Admin user not found. Run seedAdminUser first.');
    return;
  }
  const instructorId = adminResult[0]!.id;

  // 2. Create / find category "Web Design"
  let categoryId: string;
  const existingCategory = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, 'web-design'))
    .limit(1);

  if (existingCategory.length > 0) {
    categoryId = existingCategory[0]!.id;
  } else {
    categoryId = uuidv7();
    await db.insert(categoriesTable).values({
      id: categoryId,
      name: 'Web Design',
      slug: 'web-design',
      description: 'HTML, CSS e design de interfaces para a web',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3. Check if course already exists
  const existingCourse = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, 'css-essencial'))
    .limit(1);

  if (existingCourse.length > 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  → Course "CSS Essencial" already exists');
    if (!existingCourse[0]!.thumbnailUrl) {
      const thumbnailUrl = await copyCourseThumbnail('logo_curso_css_essencial.png', 'css-essencial.png');
      if (thumbnailUrl) {
        await db.update(coursesTable).set({ thumbnailUrl }).where(eq(coursesTable.slug, 'css-essencial'));
        if (env.NODE_ENV !== 'test') console.log('  → Updated thumbnail for "CSS Essencial"');
      }
    }
    return;
  }

  // 4. Create course
  const courseId = uuidv7();
  const thumbnailUrl = await copyCourseThumbnail('logo_curso_css_essencial.png', 'css-essencial.png');
  await db.insert(coursesTable).values({
    id: courseId,
    title: 'CSS Essencial',
    slug: 'css-essencial',
    description:
      'Domine o CSS do zero ao avançado com lições práticas e interativas. Aprenda a estilizar páginas web com propriedades modernas, layouts flexíveis com Flexbox e Grid, responsividade, animações e muito mais.',
    shortDescription: 'Aprenda CSS moderno do zero com editor ao vivo e exercícios práticos',
    level: 'beginner',
    tags: ['css', 'web design', 'frontend', 'flexbox', 'grid', 'responsividade'],
    status: 'published',
    price: 0,
    currency: 'BRL',
    categoryId,
    instructorId,
    thumbnailUrl,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });

  // 5. Load JSON modules and create modules → lessons → sections
  const modulesData = await loadModuleFiles();

  for (const moduleData of modulesData) {
    const moduleId = uuidv7();
    await db.insert(modulesTable).values({
      id: moduleId,
      courseId,
      title: moduleData.title,
      description: moduleData.description ?? null,
      order: moduleData.order,
      createdAt: now,
      updatedAt: now,
    });

    for (const lessonData of moduleData.lessons) {
      const lessonId = uuidv7();
      await db.insert(lessonsTable).values({
        id: lessonId,
        moduleId,
        title: lessonData.title,
        slug: lessonData.slug,
        description: lessonData.description ?? null,
        type: lessonData.type,
        isFree: lessonData.isFree ?? false,
        order: lessonData.order,
        createdAt: now,
        updatedAt: now,
      });

      for (const sectionData of lessonData.sections) {
        await db.insert(sectionsTable).values({
          id: uuidv7(),
          lessonId,
          title: sectionData.title,
          contentType: sectionData.contentType,
          content: sectionData.content,
          order: sectionData.order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  if (env.NODE_ENV !== 'test')
    console.log('  ✓ Course "CSS Essencial" seeded with all modules, lessons and sections.');
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (import.meta.main) {
  console.log('Seeding CSS course...');
  seedCssCourse()
    .then(() => {
      console.log('CSS course seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed CSS course:', error);
      process.exit(1);
    });
}
