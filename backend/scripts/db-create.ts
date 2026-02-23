/**
 * Script para criar os bancos de dados do projeto
 * Cria cursos_maroquio e cursos_maroquio_test se não existirem
 *
 * Uso: bun scripts/db-create.ts
 */

import { SQL } from 'bun';

const port = Number(process.env.POSTGRES_PORT) || 5435;
const databases = ['cursos_maroquio', 'cursos_maroquio_test'];

async function createDatabases() {
  console.log('Conectando ao PostgreSQL (banco postgres) com usuário maroquio...');
  const sql = new SQL(`postgresql://maroquio:maroquio@localhost:${port}/postgres`);

  try {
    for (const dbName of databases) {
      const result = await sql.unsafe(
        `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
      );

      if (result.length > 0) {
        console.log(`Banco "${dbName}" já existe, pulando.`);
      } else {
        await sql.unsafe(`CREATE DATABASE "${dbName}"`);
        console.log(`Banco "${dbName}" criado com sucesso!`);
      }
    }

    console.log('Todos os bancos verificados/criados.');
  } catch (error) {
    console.error('Erro ao criar bancos:', error);
    process.exit(1);
  } finally {
    await sql.close();
  }
}

createDatabases();
