# DGGS Draft Search
Semantic Search on the [OGC API - Discrete Global Grid Systems - Part 1: Core](https://docs.ogc.org/DRAFTS/21-038r1.html) draft

Acccesible via [jeremy-costello.github.io/dggs-draft-search/](https://jeremy-costello.github.io/dggs-draft-search/)

**Note: Initial loading time may be slow since [Wllama](https://github.com/ngxson/wllama) must download the [embedding model](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/blob/main/nomic-embed-text-v1.5.Q4_K_M.gguf)

## How It Works
- Scraped the draft using [requests](https://requests.readthedocs.io/en/latest/)
- Extracted data from the draft using [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- Converted data to raw text and markdown
- Generated (normalized) embeddings from the raw text using [llama.cpp](https://github.com/ggml-org/llama.cpp)
- Inserted markdown and halfvec embeddings into a PostgreSQL database using [PGlite](https://github.com/electric-sql/pglite) and [pgvector](https://github.com/pgvector/pgvector)
- Generated a [HNSW](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world) index on the halfvec embeddings using inner product distance using [pgvector](https://github.com/pgvector/pgvector)
- Query embeddings are generated client-side using [Wllama](https://github.com/ngxson/wllama) and similarity search is performed client-side using [PGlite](https://github.com/electric-sql/pglite)
- Results are displayed with title linked to the section in the draft and optionally displayed formatted markdown 
