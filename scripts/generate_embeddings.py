import json
import numpy as np
from tqdm import tqdm
from llama_cpp import Llama, LLAMA_POOLING_TYPE_MEAN, LLAMA_ROPE_SCALING_TYPE_YARN
from typing import List


EMBED_MODEL_FILE = "./models/nomic-embed-text-v1.5.Q4_K_M.gguf"
INPUT_JSON_FILE = "./data/standard.json"
OUTPUT_JSON_FILE = "./data/standard_embeddings.json"


def get_halfvec_embedding(text: str) -> List[float]:
    embedding_f32 = llm.embed(text, normalize=True)

    # Convert to float16 for pgvector halfvec
    embedding_f16 = np.array(embedding_f32, dtype=np.float16).tolist()
    return embedding_f16


if __name__ == "__main__":
    llm = Llama(
        model_path=EMBED_MODEL_FILE,
        embedding=True,
        n_ctx=8192,
        n_batch=8192,
        n_ubatch=8192,
        n_threads=4,
        n_gpu_layers=0,
        rope_scaling_type=LLAMA_ROPE_SCALING_TYPE_YARN,
        rope_freq_scale=0.75,
        flash_attn=True,
        pooling_type=LLAMA_POOLING_TYPE_MEAN
    )

    with open(INPUT_JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in tqdm(data):
        full_text = f"search_document: {item['title']}\n\n{item['text']}"
        embedding_halfvec = get_halfvec_embedding(full_text)
        item["embedding"] = embedding_halfvec  # float16-compatible for pgvector

    with open(OUTPUT_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Embeddings added in halfvec format and saved to: {OUTPUT_JSON_FILE}")
