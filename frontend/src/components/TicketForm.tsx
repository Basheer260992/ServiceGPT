import { useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import type { TicketKind, Ticket, Attachment } from '@/types';

interface Props {
  kind: TicketKind;
  defaultRequestedBy?: string;
  lockRequestedBy?: boolean;
  onSubmit: (data: Partial<Ticket>) => Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
}

const PRIORITIES = ['Critical', 'High', 'Moderate', 'Low'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Database', 'Email', 'Access', 'Security'];
const GROUPS = ['Network Team', 'Database Team', 'Application Support', 'Hardware Team', 'Security Team'];
const IMPACT = ['High', 'Medium', 'Low'];
const URGENCY = ['High', 'Medium', 'Low'];

const STATE_BY_KIND: Record<TicketKind, string[]> = {
  incidents: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
  problems: ['New', 'Root Cause Analysis', 'Known Error', 'Resolved', 'Closed'],
  changes: ['New', 'Assess', 'Approved', 'Implement', 'Review', 'Closed'],
};

export function TicketForm({ kind, defaultRequestedBy = '', lockRequestedBy, onSubmit, submitting, onCancel }: Props) {
  const states = STATE_BY_KIND[kind];
  const [form, setForm] = useState<Partial<Ticket>>({
    shortDescription: '',
    description: '',
    priority: 'Moderate',
    category: 'Software',
    assignmentGroup: GROUPS[2],
    state: states[0],
    impact: 'Medium',
    urgency: 'Medium',
    requestedBy: defaultRequestedBy,
    attachments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Ticket, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 3)) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      next.push({ name: file.name, size: file.size, dataUrl });
    }
    set('attachments', [...(form.attachments || []), ...next]);
  };

  const removeAttachment = (idx: number) => {
    const next = [...(form.attachments || [])];
    next.splice(idx, 1);
    set('attachments', next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.shortDescription?.trim()) next.shortDescription = 'Required';
    if (!form.requestedBy?.trim()) next.requestedBy = 'Required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label">Short Description *</label>
        <input
          className="input"
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
          placeholder="Brief one-line summary"
        />
        {errors.shortDescription && <div className="text-xs text-red-600 mt-1">{errors.shortDescription}</div>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[110px] resize-y"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What happened? What did you expect? Steps to reproduce."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assignment Group</label>
          <select className="input" value={form.assignmentGroup} onChange={(e) => set('assignmentGroup', e.target.value)}>
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">State</label>
          <select className="input" value={form.state} onChange={(e) => set('state', e.target.value)}>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Impact</label>
          <select className="input" value={form.impact} onChange={(e) => set('impact', e.target.value)}>
            {IMPACT.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Urgency</label>
          <select className="input" value={form.urgency} onChange={(e) => set('urgency', e.target.value)}>
            {URGENCY.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Requested By *</label>
          <input
            className="input"
            value={form.requestedBy}
            onChange={(e) => set('requestedBy', e.target.value)}
            placeholder="Full name"
            readOnly={lockRequestedBy}
            disabled={lockRequestedBy}
          />
          {lockRequestedBy && (
            <div className="text-[11px] text-slate-500 mt-1">Filed on your own behalf — locked to your account.</div>
          )}
          {errors.requestedBy && <div className="text-xs text-red-600 mt-1">{errors.requestedBy}</div>}
        </div>
      </div>

      <div>
        <label className="label">Attachments</label>
        <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 cursor-pointer transition-colors w-fit">
          <Paperclip size={16} />
          <span>Click to upload</span>
          <input type="file" className="hidden" multiple onChange={(e) => handleFiles(e.target.files)} />
        </label>
        {(form.attachments?.length || 0) > 0 && (
          <ul className="mt-2 space-y-1">
            {form.attachments!.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                <Paperclip size={12} />
                <span className="truncate flex-1">{a.name}</span>
                <span className="text-slate-500">{(a.size / 1024).toFixed(1)} KB</span>
                <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          <Send size={14} /> {submitting ? 'Submitting…' : 'Submit'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
