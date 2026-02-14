/**
 * Script to upload interactive HTML bundles for the HTML course.
 *
 * Prerequisites:
 *   1. Backend running: `bun run dev`
 *   2. HTML course seeded in the database
 *   3. Admin user exists (ricardo@maroquio.com / admin password)
 *
 * Usage:
 *   cd backend
 *   bun run scripts/upload-html-bundles.ts
 */

import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ricardo@maroquio.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234aA@#';
const BUNDLES_DIR = resolve(import.meta.dir, '../bundles/html-course');

/**
 * Mapping: bundle folder name → section identification
 * Each entry maps to { lessonTitle, sectionTitle } used to find the sectionId in the DB.
 * We match using partial lesson title + section order.
 */
const BUNDLE_SECTION_MAP: Record<string, { lessonTitle: string; sectionOrder: number }> = {
  '01-papel-html-web': { lessonTitle: 'O que é HTML?', sectionOrder: 1 },
  '02-esqueleto-html5': { lessonTitle: 'Estrutura básica', sectionOrder: 1 },
  '03-hierarquia-headings': { lessonTitle: 'Títulos e parágrafos', sectionOrder: 1 },
  '04-scroll-ancoras': { lessonTitle: 'Links e navegação', sectionOrder: 2 },
  '05-imagens-responsivas': { lessonTitle: 'Imagens', sectionOrder: 3 },
  '06-iframe-sandbox': { lessonTitle: 'Áudio e vídeo', sectionOrder: 3 },
  '07-tabelas-interativas': { lessonTitle: 'Tabelas', sectionOrder: 2 },
  '08-tipos-input': { lessonTitle: 'Formulários', sectionOrder: 2 },
  '09-validacao-nativa': { lessonTitle: 'Validação', sectionOrder: 1 },
  '10-tags-semanticas': { lessonTitle: 'Tags semânticas', sectionOrder: 1 },
  '11-navegacao-teclado': { lessonTitle: 'Acessibilidade', sectionOrder: 3 },
  '12-elementos-interativos': { lessonTitle: 'Recursos modernos', sectionOrder: 2 },
  '13-svg-canvas': { lessonTitle: 'Recursos modernos', sectionOrder: 3 },
};

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { data: { accessToken: string } };
  return body.data.accessToken;
}

async function getCourseStructure(token: string) {
  // Get course by slug
  const res = await fetch(`${API_BASE}/v1/courses/html-essencial`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get course: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as {
    data: {
      id: string;
      modules: Array<{
        id: string;
        title: string;
        lessons: Array<{
          id: string;
          title: string;
          sections: Array<{
            id: string;
            title: string;
            order: number;
          }>;
        }>;
      }>;
    };
  };
}

function findSectionId(
  course: Awaited<ReturnType<typeof getCourseStructure>>,
  lessonTitle: string,
  sectionOrder: number,
): string | null {
  for (const mod of course.data.modules) {
    for (const lesson of mod.lessons) {
      // Partial match on lesson title
      const a = lesson.title.toLowerCase();
      const b = lessonTitle.toLowerCase();
      if (a.includes(b) || b.includes(a)) {
        const section = lesson.sections.find((s) => s.order === sectionOrder);
        if (section) return section.id;
      }
    }
  }
  return null;
}

async function createZipBlob(bundleDir: string): Promise<Blob> {
  // Use Bun's built-in zip support or spawn a process
  const proc = Bun.spawn(['zip', '-j', '-r', '-', bundleDir], {
    stdout: 'pipe',
  });

  const output = await new Response(proc.stdout).arrayBuffer();
  await proc.exited;

  if (proc.exitCode !== 0) {
    throw new Error(`zip failed for ${bundleDir}`);
  }

  return new Blob([output], { type: 'application/zip' });
}

async function uploadBundle(token: string, sectionId: string, zipBlob: Blob): Promise<void> {
  const formData = new FormData();
  formData.append('file', zipBlob, 'bundle.zip');
  formData.append('activateImmediately', 'true');

  const res = await fetch(`${API_BASE}/v1/admin/sections/${sectionId}/bundles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for section ${sectionId}: ${res.status} ${text}`);
  }
}

async function main() {
  console.log('🔐 Logging in as admin...');
  const token = await login();
  console.log('✅ Logged in successfully');

  console.log('📚 Fetching course structure...');
  const course = await getCourseStructure(token);
  console.log(`✅ Found course with ${course.data.modules.length} modules`);

  const bundleDirs = await readdir(BUNDLES_DIR);
  const sortedDirs = bundleDirs.filter((d) => BUNDLE_SECTION_MAP[d]).sort();

  console.log(`\n📦 Processing ${sortedDirs.length} bundles...\n`);

  let success = 0;
  let failed = 0;

  for (const dir of sortedDirs) {
    const mapping = BUNDLE_SECTION_MAP[dir];
    if (!mapping) {
      console.log(`❌ ${dir}: No mapping found`);
      failed++;
      continue;
    }
    const sectionId = findSectionId(course, mapping.lessonTitle, mapping.sectionOrder);

    if (!sectionId) {
      console.log(`❌ ${dir}: Section not found (lesson="${mapping.lessonTitle}", order=${mapping.sectionOrder})`);
      failed++;
      continue;
    }

    try {
      process.stdout.write(`⏳ ${dir} → section ${sectionId.slice(0, 8)}...`);
      const zipBlob = await createZipBlob(join(BUNDLES_DIR, dir));
      await uploadBundle(token, sectionId, zipBlob);
      console.log(' ✅ uploaded & activated');
      success++;
    } catch (err) {
      console.log(` ❌ ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} uploaded, ${failed} failed out of ${sortedDirs.length} total`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
