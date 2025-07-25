import { useEffect, useState } from 'react';
import { initEmbedder } from './services/embed.ts';
import { initDB, searchSimilarArticles } from './services/db.ts';
import { formatMarkdown } from './services/markdown.ts';
import { type SearchResult } from './services/types.ts';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      await initDB();
      await initEmbedder();
      setInitialized(true);
    }
    init();
  }, []);

  const toggleExpanded = (id: string): void => {
    const newExpanded = new Set(expanded);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const handleSearch = async (): Promise<void> => {
    if (!query.trim()) return;
    setLoading(true);
    const res: SearchResult[] = await searchSimilarArticles(query, 25);
    setResults(res);
    setLoading(false);
  };

  if (!initialized) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      width: '100vw'
    }}>
      Loading...
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      margin: '0 auto',
      width: '100vw',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <Header />
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search..."
          style={{ width: '70%', padding: '10px', marginRight: '10px' }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.map((res) => (
        <div key={res.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a
              href={`https://docs.ogc.org/DRAFTS/21-038r1.html#${res.link}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                cursor: 'pointer', 
                color: '#1976d2', 
                margin: 0, 
                flex: 1, 
                textDecoration: 'none', 
                display: 'block' 
              }}
            >
              <h3 style={{ margin: 0 }}>{res.title}</h3>
            </a>
            <button onClick={() => toggleExpanded(res.id)} style={{ marginLeft: '10px' }}>
              {expanded.has(res.id) ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {expanded.has(res.id) && (
            <div style={{ 
              marginTop: '10px', 
              paddingTop: '10px', 
              borderTop: '1px solid #eee',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.6'
            }}>
              <style>{`
                .markdown-content pre {
                  background-color: #f5f5f5;
                  padding: 12px;
                  border-radius: 4px;
                  overflow: auto;
                  font-size: 14px;
                  font-family: Monaco, Consolas, "Courier New", monospace;
                }
                .markdown-content code {
                  background-color: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-size: 14px;
                  font-family: Monaco, Consolas, "Courier New", monospace;
                }
              `}</style>
              <div className="markdown-content">
                <Markdown remarkPlugins={[remarkGfm]}>{formatMarkdown(res.markdown)}</Markdown>
              </div>
            </div>
          )}
        </div>
      ))}
      <Footer />
    </div>
  );
}

export default App;