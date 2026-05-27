import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { CatalogService } from '@/services/misc.service';
import { TicketService } from '@/services/ticket.service';
import type { CatalogItem } from '@/types';
import { Modal } from '@/components/Modal';
import { TicketForm } from '@/components/TicketForm';
import { useAuthStore } from '@/store/auth.store';

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    CatalogService.list().then(setItems).finally(() => setLoading(false));
  }, []);

  const submit = async (data: any) => {
    setSubmitting(true);
    try {
      await TicketService.create('incidents', { ...data, category: selected?.category });
      toast.success('Service request submitted');
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Service Catalog" subtitle="Browse and request enterprise IT services" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="card p-5 h-40 skeleton" />)
          : items.map((it) => {
              const Icon = (Icons as any)[it.icon] || Icons.Package;
              return (
                <button
                  key={it.id}
                  onClick={() => setSelected(it)}
                  className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center mb-3 shadow-md group-hover:scale-105 transition">
                    <Icon size={22} />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold">{it.category}</div>
                  <h3 className="font-semibold mt-1 text-slate-900 dark:text-slate-50">{it.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{it.description}</p>
                  <div className="text-xs text-slate-400 mt-3">SLA: {it.sla}</div>
                </button>
              );
            })}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Request: ${selected?.name || ''}`}>
        {selected && (
          <TicketForm
            kind="incidents"
            defaultRequestedBy={user?.name || ''}
            submitting={submitting}
            onSubmit={submit}
            onCancel={() => setSelected(null)}
          />
        )}
      </Modal>
    </div>
  );
}
