import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { tenantFetch } from '../lib/tenantFetch';

type QuestionType = 'short' | 'long' | 'choice' | 'multi' | 'dropdown' | 'rating' | 'date' | 'file';

type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  options?: string[]; // for choice/multi/dropdown
  logic?: { whenQuestionId: string; equals: string; showQuestionId: string } | null;
};

type Theme = { font: string; primary: string; secondary: string; bg: string; variant: 'solid' | 'gradient' };

const defaultTheme: Theme = {
  font: 'Inter, sans-serif',
  primary: '#3B82F6',
  secondary: '#6B7280',
  bg: '#FFFFFF',
  variant: 'solid',
};

export default function FormBuilder() {
  const { scope, activeTenantId, loading: tenantLoading } = useActiveTenant();
  const [title, setTitle] = useState('Untitled Form');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [published, setPublished] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [tenantRoles, setTenantRoles] = useState<Array<{role_key: string, role_label: string, role_description?: string}>>([]);

  // Fetch tenant roles
  useEffect(() => {
    if (tenantLoading || (!activeTenantId && scope === 'tenant')) return;
    
    const fetchTenantRoles = async () => {
      try {
        const res = await tenantFetch('/api/tenant-roles', {}, activeTenantId || undefined, scope);
        const data = await res.json();
        
        if (res.ok) {
          setTenantRoles(data.roles || []);
        }
      } catch (error) {
        console.error('Error fetching tenant roles:', error);
      }
    };
    
    fetchTenantRoles();
  }, [activeTenantId, scope, tenantLoading]);

  useEffect(() => {
    if (saving === 'saving') return;
    if (!title && questions.length === 0) return;
    if (tenantLoading || (!activeTenantId && scope === 'tenant')) return;
    
    const id = setTimeout(async () => {
      setSaving('saving');
      try {
        // Use tenant-scoped API instead of direct Supabase call
        const res = await tenantFetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            schema: questions, 
            assigned_roles: assignedRoles, 
            theme, 
            published 
          })
        }, activeTenantId || undefined, scope);
        
        if (res.ok) {
          setSaving('saved');
          setLastSavedAt(new Date());
        } else {
          setSaving('idle');
        }
      } catch (_e) {
        setSaving('idle');
      } finally {
        setTimeout(() => setSaving('idle'), 1200);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [title, questions, assignedRoles, theme, published, activeTenantId, scope, tenantLoading]);

  const addQuestion = (type: QuestionType) => {
    const q: Question = { id: crypto.randomUUID(), type, label: defaultLabel(type), required: false, options: needsOptions(type) ? ['Option 1'] : undefined, logic: null };
    setQuestions((prev) => [...prev, q]);
    setActiveIdx(questions.length);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const next = [...questions];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setQuestions(next);
    setActiveIdx(to);
  };

  const onDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (e: React.DragEvent, idx: number) => {
    const from = Number(e.dataTransfer.getData('text/plain'));
    move(from, idx);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (activeIdx === idx) setActiveIdx(-1);
  };

  const RoleChip = ({ value }: { value: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs ${roleChip(value)}`}>{value}</span>
  );

  const toolbar = (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={() => setPublished(false)}>Save Draft</button>
        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => setPublished(true)}>Publish</button>
        <span className="text-xs text-gray-500 ml-2">{saving === 'saving' ? 'Saving…' : saving === 'saved' && lastSavedAt ? `Last saved ${timeAgo(lastSavedAt)}` : ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <AddMenu onPick={addQuestion} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.font }}>
      {toolbar}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        {/* Left: Live Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <input className="text-2xl font-bold w-full mb-4 outline-none border-b border-transparent focus:border-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="rounded-xl p-6" style={previewBg(theme)}>
            {questions.length === 0 && (
              <div className="text-gray-500 text-sm">No questions yet. Use “Add Question” to get started.</div>
            )}
            <div className="space-y-4">
              {questions.map((q) => (
                <PreviewQuestion key={q.id} q={q} theme={theme} />
              ))}
            </div>
          </div>
          {/* Theme selector */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500">Primary</label>
              <input type="color" className="w-full h-10 border rounded" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Secondary</label>
              <input type="color" className="w-full h-10 border rounded" value={theme.secondary} onChange={(e) => setTheme({ ...theme, secondary: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Background</label>
              <input type="color" className="w-full h-10 border rounded" value={theme.bg} onChange={(e) => setTheme({ ...theme, bg: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Variant</label>
              <select className="w-full h-10 border rounded px-2" value={theme.variant} onChange={(e) => setTheme({ ...theme, variant: e.target.value as any })}>
                <option value="solid">Solid</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Field configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Fields</div>
            <div className="flex items-center gap-2">
              <RolePicker value={assignedRoles} onChange={setAssignedRoles} tenantRoles={tenantRoles} />
              <AddMenu onPick={addQuestion} />
            </div>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id}
                   className={`rounded-xl border ${idx === activeIdx ? 'border-blue-500' : 'border-gray-200'} bg-white shadow-sm p-3 transition hover:shadow`} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`text-gray-600 ${iconFor(q.type)}`}></i>
                    <span className="text-sm font-medium capitalize">{human(q.type)}</span>
                    <span className="text-xs text-gray-400">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={() => move(idx, idx - 1)} title="Move up">↑</button>
                    <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={() => move(idx, idx + 1)} title="Move down">↓</button>
                    <button className="px-2 py-1 rounded hover:bg-red-50 text-red-600" onClick={() => removeQuestion(idx)} title="Remove">Delete</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-600">Label</label>
                    <input className="w-full border rounded px-3 py-2" value={q.label} onChange={(e) => updateQuestion(idx, { label: e.target.value })} />
                  </div>
                  {(q.type === 'choice' || q.type === 'multi' || q.type === 'dropdown') && (
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">Options (comma separated)</label>
                      <input className="w-full border rounded px-3 py-2" value={(q.options || []).join(', ')} onChange={(e) => updateQuestion(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={!!q.required} onChange={(e) => updateQuestion(idx, { required: e.target.checked })} /> Required
                    </label>
                  </div>
                  {/* Conditional logic */}
                  {questions.length > 1 && (
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Conditional Logic</div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <select className="border rounded px-2 py-2" value={q.logic?.whenQuestionId || ''} onChange={(e) => updateQuestion(idx, { logic: { ...(q.logic || { equals: '', showQuestionId: '' }), whenQuestionId: e.target.value } })}>
                          <option value="">When question…</option>
                          {questions.filter((_, i) => i !== idx).map((qq) => (
                            <option key={qq.id} value={qq.id}>{qq.label || human(qq.type)}</option>
                          ))}
                        </select>
                        <input className="border rounded px-2 py-2" placeholder="equals…" value={q.logic?.equals || ''} onChange={(e) => updateQuestion(idx, { logic: { ...(q.logic || { whenQuestionId: '', showQuestionId: '' }), equals: e.target.value } })} />
                        <select className="border rounded px-2 py-2" value={q.logic?.showQuestionId || ''} onChange={(e) => updateQuestion(idx, { logic: { ...(q.logic || { whenQuestionId: '', equals: '' }), showQuestionId: e.target.value } })}>
                          <option value="">then show…</option>
                          {questions.filter((_, i) => i !== idx).map((qq) => (
                            <option key={qq.id} value={qq.id}>{qq.label || human(qq.type)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultLabel(type: QuestionType) {
  switch (type) {
    case 'short': return 'Short answer';
    case 'long': return 'Long answer';
    case 'choice': return 'Multiple choice';
    case 'multi': return 'Checkboxes';
    case 'dropdown': return 'Dropdown';
    case 'rating': return 'Rating';
    case 'date': return 'Date';
    case 'file': return 'File upload';
  }
}
function needsOptions(type: QuestionType) {
  return type === 'choice' || type === 'multi' || type === 'dropdown';
}
function human(type: QuestionType) {
  return defaultLabel(type);
}
function iconFor(type: QuestionType) {
  switch (type) {
    case 'short': return 'fa-solid fa-i-cursor';
    case 'long': return 'fa-solid fa-align-left';
    case 'choice': return 'fa-solid fa-dot-circle';
    case 'multi': return 'fa-solid fa-check-square';
    case 'dropdown': return 'fa-solid fa-caret-down';
    case 'rating': return 'fa-solid fa-star';
    case 'date': return 'fa-solid fa-calendar';
    case 'file': return 'fa-solid fa-file-upload';
  }
}
function previewBg(theme: Theme) {
  if (theme.variant === 'gradient') {
    return { backgroundImage: `linear-gradient(135deg, ${theme.primary}33, ${theme.secondary}33)`, backgroundColor: theme.bg } as React.CSSProperties;
  }
  return { backgroundColor: theme.bg } as React.CSSProperties;
}
function timeAgo(d: Date) {
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60); if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60); return `${hr}h ago`;
}
function roleChip(role: string) {
  switch (String(role || '').toLowerCase()) {
    case 'admin': return 'bg-blue-100 text-blue-700';
    case 'recruitpro': return 'bg-green-100 text-green-700';
    case 'jobseeker': return 'bg-orange-100 text-orange-700';
    case 'client': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function AddMenu({ onPick }: { onPick: (t: QuestionType) => void }) {
  const items: { key: QuestionType; label: string; icon: string }[] = [
    { key: 'short', label: 'Short Answer', icon: 'fa-solid fa-i-cursor' },
    { key: 'long', label: 'Paragraph', icon: 'fa-solid fa-align-left' },
    { key: 'choice', label: 'Multiple Choice', icon: 'fa-solid fa-dot-circle' },
    { key: 'multi', label: 'Multi-select', icon: 'fa-solid fa-check-square' },
    { key: 'dropdown', label: 'Dropdown', icon: 'fa-solid fa-caret-down' },
    { key: 'rating', label: 'Rating', icon: 'fa-solid fa-star' },
    { key: 'date', label: 'Date', icon: 'fa-solid fa-calendar' },
    { key: 'file', label: 'File Upload', icon: 'fa-solid fa-file-upload' },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => setOpen((v) => !v)}>
        <i className="fa-solid fa-plus mr-2"></i>Add Question
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded-xl shadow-lg w-60 z-30">
          {items.map((it) => (
            <button key={it.key} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { onPick(it.key); setOpen(false); }}>
              <i className={`${it.icon} text-gray-600`}></i>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewQuestion({ q, theme }: { q: Question; theme: Theme }) {
  const base = 'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2';
  const ring = { borderColor: '#e5e7eb', boxShadow: `0 0 0 2px ${theme.primary}33` } as React.CSSProperties;
  switch (q.type) {
    case 'short':
      return <input className={base} placeholder={q.label} style={{ fontFamily: theme.font }} readOnly />;
    case 'long':
      return <textarea className={base} placeholder={q.label} rows={4} style={{ fontFamily: theme.font }} readOnly />;
    case 'choice':
      return (
        <div className="space-y-2">
          <div className="font-medium">{q.label}</div>
          {(q.options || []).map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm"><input type="radio" disabled />{o}</label>
          ))}
        </div>
      );
    case 'multi':
      return (
        <div className="space-y-2">
          <div className="font-medium">{q.label}</div>
          {(q.options || []).map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled />{o}</label>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <div>
          <div className="font-medium mb-1">{q.label}</div>
          <select className={base} style={{ fontFamily: theme.font }} disabled>
            {(q.options || []).map((o, i) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );
    case 'rating':
      return (
        <div>
          <div className="font-medium mb-1">{q.label}</div>
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
          </div>
        </div>
      );
    case 'date':
      return (
        <div>
          <div className="font-medium mb-1">{q.label}</div>
          <input type="date" className={base} readOnly />
        </div>
      );
    case 'file':
      return (
        <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">
          <i className="fa-solid fa-cloud-upload text-2xl mb-2"></i>
          <div>{q.label || 'Upload a file'}</div>
        </div>
      );
  }
}

function RolePicker({ value, onChange, tenantRoles }: { 
  value: string[]; 
  onChange: (v: string[]) => void; 
  tenantRoles: Array<{role_key: string, role_label: string, role_description?: string}>
}) {
  const toggle = (k: string) => {
    const set = new Set(value);
    set.has(k) ? set.delete(k) : set.add(k);
    onChange(Array.from(set));
  };
  
  // Show loading state if no tenant roles loaded yet
  if (tenantRoles.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <i className="fa-solid fa-spinner fa-spin"></i>
        Loading roles...
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {tenantRoles.map((r) => (
        <button 
          key={r.role_key} 
          type="button" 
          title={r.role_description || r.role_label} 
          onClick={() => toggle(r.role_key)} 
          className={`px-3 py-1 rounded-full text-xs border ${
            value.includes(r.role_key) 
              ? roleChip(r.role_key) + ' border-transparent' 
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {r.role_label}
        </button>
      ))}
    </div>
  );
}


