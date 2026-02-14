import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  sectionBundlesTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { env } from '@shared/config/env.ts';
import { v7 as uuidv7 } from 'uuid';

/**
 * Interactive sections to add to the HTML course.
 * Each entry maps a bundle to a module/lesson position.
 */
const INTERACTIVE_SECTIONS = [
  {
    moduleTitle: 'Fundamentos',
    lessonSlug: 'o-que-e-html',
    sectionTitle: 'Demo: As 3 Camadas da Web',
    sectionOrder: 2, // Insert after first text section, before exercise
    bundleName: '01-papel-html-web',
  },
  {
    moduleTitle: 'Fundamentos',
    lessonSlug: 'estrutura-basica-documento',
    sectionTitle: 'Demo: Estrutura HTML5',
    sectionOrder: 3, // After text sections, before exercise
    bundleName: '02-esqueleto-html5',
  },
  {
    moduleTitle: 'Textos e Links',
    lessonSlug: 'titulos-e-paragrafos',
    sectionTitle: 'Demo: Hierarquia de Títulos',
    sectionOrder: 3,
    bundleName: '03-hierarquia-headings',
  },
  {
    moduleTitle: 'Textos e Links',
    lessonSlug: 'links-e-navegacao',
    sectionTitle: 'Demo: Navegação com Âncoras',
    sectionOrder: 4,
    bundleName: '04-scroll-ancoras',
  },
  {
    moduleTitle: 'Listas, Imagens e Mídia',
    lessonSlug: 'imagens',
    sectionTitle: 'Demo: Imagens Responsivas',
    sectionOrder: 4,
    bundleName: '05-imagens-responsivas',
  },
  {
    moduleTitle: 'Listas, Imagens e Mídia',
    lessonSlug: 'audio-e-video',
    sectionTitle: 'Demo: iFrames com Sandbox',
    sectionOrder: 4,
    bundleName: '06-iframe-sandbox',
  },
  {
    moduleTitle: 'Tabelas e Formulários',
    lessonSlug: 'tabelas',
    sectionTitle: 'Demo: Tabelas HTML',
    sectionOrder: 3,
    bundleName: '07-tabelas-interativas',
  },
  {
    moduleTitle: 'Tabelas e Formulários',
    lessonSlug: 'formularios-campos-de-entrada',
    sectionTitle: 'Demo: Tipos de Input HTML5',
    sectionOrder: 4,
    bundleName: '08-tipos-input',
  },
  {
    moduleTitle: 'Tabelas e Formulários',
    lessonSlug: 'formularios-validacao-e-agrupamento',
    sectionTitle: 'Demo: Validação Nativa',
    sectionOrder: 4,
    bundleName: '09-validacao-nativa',
  },
  {
    moduleTitle: 'HTML Semântico e Acessibilidade',
    lessonSlug: 'tags-semanticas-de-layout',
    sectionTitle: 'Demo: Tags Semânticas',
    sectionOrder: 4,
    bundleName: '10-tags-semanticas',
  },
  {
    moduleTitle: 'HTML Semântico e Acessibilidade',
    lessonSlug: 'acessibilidade-com-html',
    sectionTitle: 'Demo: Navegação por Teclado',
    sectionOrder: 4,
    bundleName: '11-navegacao-teclado',
  },
  {
    moduleTitle: 'Recursos Avançados e Projeto Final',
    lessonSlug: 'recursos-modernos-html5',
    sectionTitle: 'Demo: Elementos Interativos',
    sectionOrder: 4,
    bundleName: '12-elementos-interativos',
  },
  {
    moduleTitle: 'Recursos Avançados e Projeto Final',
    lessonSlug: 'recursos-modernos-html5',
    sectionTitle: 'Demo: SVG e Canvas',
    sectionOrder: 5,
    bundleName: '13-svg-canvas',
  },
];

/**
 * Add interactive sections with bundles to the HTML course.
 * Idempotent — skips if sections already exist.
 */
export async function addInteractiveSections(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // 1. Find the HTML course
  const courseResult = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, 'html-essencial'))
    .limit(1);

  if (courseResult.length === 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  ⚠ Course "HTML Essencial" not found. Run seedHtmlCourse first.');
    return;
  }

  const courseId = courseResult[0]!.id;
  console.log(`  → Found course: ${courseResult[0]!.title} (${courseId})`);

  // 2. Process each interactive section
  let addedCount = 0;
  let skippedCount = 0;

  for (const interactiveData of INTERACTIVE_SECTIONS) {
    // Find module
    const moduleResult = await db
      .select()
      .from(modulesTable)
      .where(and(eq(modulesTable.courseId, courseId), eq(modulesTable.title, interactiveData.moduleTitle)))
      .limit(1);

    if (moduleResult.length === 0) {
      console.log(`  ⚠ Module "${interactiveData.moduleTitle}" not found, skipping...`);
      skippedCount++;
      continue;
    }

    const moduleId = moduleResult[0]!.id;

    // Find lesson
    const lessonResult = await db
      .select()
      .from(lessonsTable)
      .where(and(eq(lessonsTable.moduleId, moduleId), eq(lessonsTable.slug, interactiveData.lessonSlug)))
      .limit(1);

    if (lessonResult.length === 0) {
      console.log(`  ⚠ Lesson "${interactiveData.lessonSlug}" not found in module "${interactiveData.moduleTitle}", skipping...`);
      skippedCount++;
      continue;
    }

    const lessonId = lessonResult[0]!.id;

    // Check if section already exists
    const existingSection = await db
      .select()
      .from(sectionsTable)
      .where(and(eq(sectionsTable.lessonId, lessonId), eq(sectionsTable.title, interactiveData.sectionTitle)))
      .limit(1);

    if (existingSection.length > 0) {
      console.log(`  → Section "${interactiveData.sectionTitle}" already exists, skipping...`);
      skippedCount++;
      continue;
    }

    // Create interactive section
    const sectionId = uuidv7();
    await db.insert(sectionsTable).values({
      id: sectionId,
      lessonId,
      title: interactiveData.sectionTitle,
      description: null,
      contentType: 'interactive',
      content: null, // Bundles are the only source of content
      order: interactiveData.sectionOrder,
      createdAt: now,
      updatedAt: now,
    });

    // Create section bundle entry
    const storagePath = `sections/${sectionId}/v1`;
    await db.insert(sectionBundlesTable).values({
      id: uuidv7(),
      sectionId,
      version: 1,
      entrypoint: 'index.html',
      storagePath,
      manifestJson: null,
      isActive: true,
      createdAt: now,
    });

    console.log(`  ✓ Added interactive section: "${interactiveData.sectionTitle}" (${interactiveData.bundleName})`);
    addedCount++;
  }

  console.log(`\n  Summary: ${addedCount} sections added, ${skippedCount} skipped.`);

  if (addedCount > 0) {
    console.log('\n  ⚠ IMPORTANT: You must now copy bundle files to the correct paths.');
    console.log('  Run the following script to copy bundles:');
    console.log('    bun run scripts/copy-bundles-to-sections.ts');
  }
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (import.meta.main) {
  console.log('Adding interactive sections to HTML course...\n');
  addInteractiveSections()
    .then(() => {
      console.log('\n✓ Interactive sections process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Failed to add interactive sections:', error);
      process.exit(1);
    });
}
