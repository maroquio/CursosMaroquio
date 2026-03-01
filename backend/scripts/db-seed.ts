/**
 * Script para executar todos os seeds do banco de dados
 *
 * Uso: bun scripts/db-seed.ts
 */

import {
  seedRoles,
  seedPermissions,
  seedAdminUser,
  seedHtmlCourse,
  seedPythonCourse,
  seedCssCourse,
} from '../src/infrastructure/database/seeds/index.ts';
import { closeDatabase } from '../src/infrastructure/database/connection.ts';

async function runSeeds() {
  console.log('Executando seeds...');

  try {
    await seedRoles();
    console.log('  ✓ Roles');

    await seedPermissions();
    console.log('  ✓ Permissions');

    await seedAdminUser();
    console.log('  ✓ Admin user');

    await seedHtmlCourse();
    console.log('  ✓ HTML course');

    await seedPythonCourse();
    console.log('  ✓ Python course');

    await seedCssCourse();
    console.log('  ✓ CSS course');

    console.log('Seeds executados com sucesso!');
  } catch (error) {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runSeeds();
