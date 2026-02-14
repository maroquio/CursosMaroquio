import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const connection = postgres(process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app');
const db = drizzle(connection);

async function main() {
  const results = await db.execute(sql`
    SELECT e.id, e.user_id, e.course_id, e.status, e.progress, u.email, c.title 
    FROM enrollments e 
    LEFT JOIN users u ON e.user_id = u.id 
    LEFT JOIN courses c ON e.course_id = c.id
  `);

  console.log('Matrículas encontradas:');
  console.table(results);
  
  await connection.end();
}

main();
