import { useEffect, useState } from 'react';
import { Search, BookOpenText, Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { KnowledgeService } from '@/services/misc.service';
import type { KnowledgeArticle } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<KnowledgeArticle | null>(null);
  const debounced = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    KnowledgeService.list(debounced).then(setArticles).finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div>
      <PageHeader title="Knowledge Base" subtitle="Self-service answers from your IT team" />

      <div className="card p-3 mb-4 flex items-center">
        <Search size={16} className="ml-2 text-slate-400" />
        <input
          className="input border-none focus:ring-0"
          placeholder="Search articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 h-36 skeleton" />)
          : articles.map((a) => (
              <button
                key={a.id}
                onClick={() => setOpen(a)}
                className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-600">
                  <BookOpenText size={14} /> {a.category}
                </div>
                <h3 className="font-semibold mt-1 text-slate-900 dark:text-slate-50">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>By {a.author}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {a.views}</span>
                </div>
              </button>
            ))}
        {!loading && articles.length === 0 && (
          <div className="md:col-span-2 text-center py-12 text-slate-500">No articles match your search.</div>
        )}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title || ''}>
        {open && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="badge bg-brand-100 text-brand-700">{open.category}</span>
              <span>By {open.author}</span>
              <span>· {open.views} views</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">{open.summary}</p>
            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{open.body}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
