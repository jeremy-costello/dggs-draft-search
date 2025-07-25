import { Wllama } from '@wllama/wllama';

export const EMBED_MODEL_REPO = 'nomic-ai/nomic-embed-text-v1.5-GGUF';
export const EMBED_MODEL_FILE = 'nomic-embed-text-v1.5.Q4_K_M.gguf';

let embedder: Wllama | null = null;

export function modelDownloadCallback(progress: { loaded: number, total: number }) {
  console.log(`Loading model: ${Math.round((progress.loaded / progress.total) * 100)}%`);
}

export async function initEmbedder(): Promise<void> {
  if (embedder) return;

  const WLLAMA_WASM_PATH_MAIN = `wllama/`;

  const WLLAMA_CONFIG_PATHS = {
    'single-thread/wllama.wasm': WLLAMA_WASM_PATH_MAIN + 'single.wasm',
    'multi-thread/wllama.wasm': WLLAMA_WASM_PATH_MAIN + 'multi.wasm'
  };
  embedder = new Wllama(WLLAMA_CONFIG_PATHS, { allowOffline: true });

  await embedder.loadModelFromHF(
    EMBED_MODEL_REPO,
    EMBED_MODEL_FILE,
    {
      progressCallback: modelDownloadCallback,
      embeddings: true,
      pooling_type: 'LLAMA_POOLING_TYPE_MEAN',
      n_ctx: 512,
      useCache: true,
      n_batch: 512,
      rope_scaling_type: "LLAMA_ROPE_SCALING_TYPE_YARN",
      rope_freq_scale: 0.75
    }
  );
}

export async function embedText(text: string, format: 'query' | 'document'): Promise<number[]> {
  if (!embedder) throw new Error('Embedder not initialized');

  const input = `search_${format}: ${text}`;
  const tokens = (await embedder.tokenize(input)).slice(0, 512);
  return await embedder.embeddings(tokens);
}
