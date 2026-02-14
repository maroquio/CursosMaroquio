#!/usr/bin/env bun
/**
 * Script to copy HTML course bundles from bundles/html-course/ to the correct section paths.
 * Reads section IDs from database and copies corresponding bundles.
 */

import { eq } from 'drizzle-orm';
import { getDatabase } from '../src/infrastructure/database/connection.ts';
import { sectionsTable, sectionBundlesTable } from '../src/contexts/courses/infrastructure/persistence/drizzle/schema.ts';
import * as fs from 'fs';
import * as path from 'path';

const BUNDLES_SOURCE_DIR = path.join(import.meta.dir, '../bundles/html-course');
const UPLOADS_BASE_DIR = path.join(import.meta.dir, '../uploads/bundles');

// Mapping from bundle names to section titles
const BUNDLE_MAP: Record<string, string> = {
  '01-papel-html-web': 'Demo: As 3 Camadas da Web',
  '02-esqueleto-html5': 'Demo: Estrutura HTML5',
  '03-hierarquia-headings': 'Demo: Hierarquia de Títulos',
  '04-scroll-ancoras': 'Demo: Navegação com Âncoras',
  '05-imagens-responsivas': 'Demo: Imagens Responsivas',
  '06-iframe-sandbox': 'Demo: iFrames com Sandbox',
  '07-tabelas-interativas': 'Demo: Tabelas HTML',
  '08-tipos-input': 'Demo: Tipos de Input HTML5',
  '09-validacao-nativa': 'Demo: Validação Nativa',
  '10-tags-semanticas': 'Demo: Tags Semânticas',
  '11-navegacao-teclado': 'Demo: Navegação por Teclado',
  '12-elementos-interativos': 'Demo: Elementos Interativos',
  '13-svg-canvas': 'Demo: SVG e Canvas',
};

/**
 * Recursively copy directory contents
 */
function copyDirectory(src: string, dest: string): void {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function copyBundles(): Promise<void> {
  const db = getDatabase();

  console.log('🔍 Finding interactive sections in database...\n');

  // Get all interactive sections with their bundles
  const interactiveSections = await db
    .select({
      sectionId: sectionsTable.id,
      sectionTitle: sectionsTable.title,
      storagePath: sectionBundlesTable.storagePath,
    })
    .from(sectionsTable)
    .innerJoin(sectionBundlesTable, eq(sectionsTable.id, sectionBundlesTable.sectionId))
    .where(eq(sectionsTable.contentType, 'interactive'));

  if (interactiveSections.length === 0) {
    console.log('⚠ No interactive sections found. Run addInteractiveSections first.');
    return;
  }

  console.log(`✓ Found ${interactiveSections.length} interactive sections\n`);

  let copiedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const section of interactiveSections) {
    // Find corresponding bundle name
    const bundleName = Object.keys(BUNDLE_MAP).find(
      (key) => BUNDLE_MAP[key] === section.sectionTitle
    );

    if (!bundleName) {
      console.log(`⚠ No bundle mapping found for: "${section.sectionTitle}"`);
      skippedCount++;
      continue;
    }

    const sourcePath = path.join(BUNDLES_SOURCE_DIR, bundleName);
    const destPath = path.join(UPLOADS_BASE_DIR, section.storagePath);

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`✗ Source not found: ${sourcePath}`);
      errorCount++;
      continue;
    }

    // Check if destination already exists
    if (fs.existsSync(destPath)) {
      console.log(`→ Already exists: "${section.sectionTitle}" (${bundleName})`);
      skippedCount++;
      continue;
    }

    try {
      // Copy bundle files
      copyDirectory(sourcePath, destPath);
      console.log(`✓ Copied: "${section.sectionTitle}" (${bundleName})`);
      console.log(`  ${sourcePath}`);
      console.log(`  → ${destPath}\n`);
      copiedCount++;
    } catch (error) {
      console.error(`✗ Error copying "${section.sectionTitle}":`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✓ Copied: ${copiedCount}`);
  console.log(`  → Skipped: ${skippedCount}`);
  console.log(`  ✗ Errors: ${errorCount}`);

  if (copiedCount > 0) {
    console.log('\n✓ Bundles copied successfully!');
    console.log('  You can now test interactive sections in the frontend.');
  }
}

// Run the script
console.log('📦 Copying HTML course bundles to section paths...\n');
copyBundles()
  .then(() => {
    console.log('\n✓ Bundle copy process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Failed to copy bundles:', error);
    process.exit(1);
  });
