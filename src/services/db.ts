import { PGlite, type PGliteOptions, MemoryFS } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { embedText } from './embed';
import { type SearchResult } from './types.ts';

const DB_NAME = 'standard.db';
let db: PGlite | null = null;

export async function initDB(): Promise<PGlite> {
  if (db) return db;

  const res = await fetch(`db/${DB_NAME}`);
  const blob = await res.blob();
  const file = new File([blob], DB_NAME, { type: "application/gzip" });

  const config: PGliteOptions = {
    fs: new MemoryFS(),
    extensions: { vector },
    loadDataDir: file
  }

  db = await PGlite.create(config);
  return db;
}

export async function searchSimilarArticles(query: string, limit: number): Promise<SearchResult[]> {
  await initDB();
  const embedding = await embedText(query, 'query');
  const embeddingStr = `[${embedding.join(",")}]`;

  const result = await db!.query(
    `SELECT id, title, link, markdown, embedding <-> $1 AS similarity
     FROM standard
     ORDER BY embedding <-> $1
     LIMIT $2`,
    [embeddingStr, limit]
  );

  return result.rows as SearchResult[];
}
