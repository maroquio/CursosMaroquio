/**
 * Script para executar apenas os seeds de infraestrutura base.
 * Usado no pipeline de deploy para garantir que roles, permissions e
 * admin user existam sem apagar dados transacionais de produção.
 *
 * Todos os seeds são idempotentes: verificam existência antes de inserir.
 *
 * Uso: bun scripts/db-seed-base.ts
 */

import {
  seedRoles,
  seedPermissions,
  seedAdminUser,
} from '../src/infrastructure/database/seeds/index.ts';
import { closeDatabase } from '../src/infrastructure/database/connection.ts';

async function runBaseSeeds() {
  console.log('Executando seeds base...');

  try {
    await seedRoles();
    console.log('  ✓ Roles');

    await seedPermissions();
    console.log('  ✓ Permissions');

    await seedAdminUser();
    console.log('  ✓ Admin user');

    console.log('Seeds base executados com sucesso!');
  } catch (error) {
    console.error('Erro ao executar seeds base:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runBaseSeeds();
