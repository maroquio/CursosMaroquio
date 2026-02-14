/**
 * Script para resetar o banco de dados
 * Remove todas as tabelas e recria o schema public vazio
 *
 * Uso: bun scripts/db-reset.ts
 */

import { SQL } from 'bun';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app';

async function resetDatabase() {
  console.log('Conectando ao banco de dados...');
  const sql = new SQL(databaseUrl);

  try {
    console.log('Removendo schema public...');
    await sql.unsafe('DROP SCHEMA public CASCADE');

    console.log('Recriando schema public...');
    await sql.unsafe('CREATE SCHEMA public');

    console.log('Schema resetado com sucesso!');
  } catch (error) {
    console.error('Erro ao resetar banco:', error);
    process.exit(1);
  } finally {
    await sql.close();
  }
}

resetDatabase();
