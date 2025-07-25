import { PGlite, PGliteOptions, MemoryFS } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import fs from 'fs/promises';
import { Buffer } from 'buffer';

// Load data from JSON
const loadData = async () => {
  const filePath = "./data/standard_embeddings.json";
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
};

async function main() {
  const config: PGliteOptions = {
    fs: new MemoryFS(),
    extensions: { vector }
  }

  const db = await PGlite.create(config);

  await db.exec(`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS standard (
      id SERIAL PRIMARY KEY,
      link TEXT NOT NULL,
      title TEXT NOT NULL,
      markdown TEXT NOT NULL,
      embedding halfvec(768)
    );
  `);

  const sections = await loadData();

  for (const section of sections) {
    const { link, title, markdown, embedding } = section;

    // Optional: validate or normalize the embedding here
    if (!embedding || !Array.isArray(embedding)) continue;

    const embeddingStr = `[${embedding.map((v: number) => v.toFixed(6)).join(',')}]`;
    await db.query(
      `
      INSERT INTO standard (link, title, markdown, embedding)
      VALUES ($1, $2, $3, $4)
      `,
      [link, title, markdown, embeddingStr]
    );
  }

  // Create HNSW index with halfvec
  await db.exec(`
    CREATE INDEX ON standard
    USING hnsw (embedding halfvec_ip_ops)
    WITH (m = 16, ef_construction = 100);
  `);

  // Dump database to file
  const outputPath = "./data/standard.db";
  const file = await db.dumpDataDir();
  const arrayBuffer = await file.arrayBuffer(); // convert File to ArrayBuffer
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(outputPath, buffer);

  console.log(`Database created and saved to ${outputPath}`);
}

main().catch((err) => {
  console.error('Failed to generate database:', err);
});
