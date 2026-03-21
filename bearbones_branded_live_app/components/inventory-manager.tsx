'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stats';
import { CATEGORIES, LOCATIONS, STATUSES, type Category, type GearItem, type GearStatus, type LocationType } from '@/lib/types';
import { currency } from '@/lib/utils';
import { deleteGear, listGear, upsertGear } from '@/lib/queries';
import { demoGear } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase';

const emptyForm = {
  id: '',
  name: '',
  category: 'cameras' as Category,
  brand: '',
  model: '',
  serial_number: '',
  barcode: '',
  location: 'Office' as LocationType,
  status: 'Available' as GearStatus,
  notes: '',
  image_url: '',
  replacement_value: '',
};

export function InventoryManager() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [editing, setEditing] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const rows = isSupabaseConfigured ? await listGear() : demoGear;
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load inventory.');
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const q = query.toLowerCase();
    return (category === 'all' || item.category === category)
      && (status === 'all' || item.status === status)
      && (location === 'all' || item.location === location)
      && (!q || [item.name, item.brand ?? '', item.model ?? '', item.serial_number ?? ''].join(' ').toLowerCase().includes(q));
  }), [items, query, category, status, location]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        await upsertGear({
          ...(editing.id ? { id: editing.id } : {}),
          name: editing.name,
          category: editing.category,
          brand: editing.brand || null,
          model: editing.model || null,
          serial_number: editing.serial_number || null,
          barcode: editing.barcode || null,
          location: editing.location,
          status: editing.status,
          notes: editing.notes || null,
          image_url: editing.image_url || null,
          replacement_value: editing.replacement_value ? Number(editing.replacement_value) : null,
        });
        await load();
      } else {
        const newItem: GearItem = {
          id: editing.id || Math.random().toString(36).slice(2),
          name: editing.name,
          category: editing.category,
          brand: editing.brand || null,
          model: editing.model || null,
          serial_number: editing.serial_number || null,
          barcode: editing.barcode || null,
          location: editing.location,
          status: editing.status,
          notes: editing.notes || null,
          image_url: editing.image_url || null,
          replacement_value: editing.replacement_value ? Number(editing.replacement_value) : null,
          owner_id: 'demo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => {
          const exists = prev.some((item) => item.id === newItem.id);
          return exists ? prev.map((item) => item.id === newItem.id ? newItem : item) : [newItem, ...prev];
        });
      }
      setEditing(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save gear item.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this gear item?')) return;
    try {
      if (isSupabaseConfigured) {
        await deleteGear(id);
        await load();
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete gear item.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track every body, lens, light, mic, stand, prop, and oddball kit piece across office, studio, and active shoots."
        actions={!isSupabaseConfigured ? <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-yellow-200">Demo mode: add Supabase keys to enable live cloud data</div> : null}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Total items" value={String(items.length)} icon={<Camera className="h-4 w-4" />} />
        <StatCard label="Available" value={String(items.filter((i) => i.status === 'Available').length)} icon={<Plus className="h-4 w-4" />} />
        <StatCard label="Checked out" value={String(items.filter((i) => i.status === 'Checked Out').length)} icon={<Search className="h-4 w-4" />} />
        <StatCard label="Needs attention" value={String(items.filter((i) => i.status === 'Maintenance' || i.status === 'Missing').length)} icon={<Wrench className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <section className="card p-4 md:p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="label">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="field pl-9" placeholder="Search gear, model, serial…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All</option>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div>
              <label className="label">Location</label>
              <select className="field" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="all">All</option>
                {LOCATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-panel2 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <span className="badge border-border bg-panel text-muted">{item.category}</span>
                      <span className="badge border-border bg-panel text-muted">{item.location}</span>
                      <span className="badge border-border bg-panel text-muted">{item.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      {[item.brand, item.model].filter(Boolean).join(' · ') || 'No brand/model listed'}
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted md:grid-cols-3">
                      <div>Serial: {item.serial_number ?? '—'}</div>
                      <div>Barcode: {item.barcode ?? '—'}</div>
                      <div>Value: {currency(item.replacement_value)}</div>
                    </div>
                    {item.notes ? <p className="mt-3 text-sm text-muted">{item.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => setEditing({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      brand: item.brand ?? '',
                      model: item.model ?? '',
                      serial_number: item.serial_number ?? '',
                      barcode: item.barcode ?? '',
                      location: item.location,
                      status: item.status,
                      notes: item.notes ?? '',
                      image_url: item.image_url ?? '',
                      replacement_value: item.replacement_value?.toString() ?? '',
                    })}>Edit</button>
                    <button className="btn-danger" onClick={() => void onDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">No gear matches your filters.</div> : null}
          </div>
        </section>

        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-xl font-semibold">{editing.id ? 'Edit gear item' : 'Add gear item'}</h2>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div>
              <label className="label">Item name</label>
              <input className="field" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select className="field" value={editing.category} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value as Category }))}>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <select className="field" value={editing.location} onChange={(e) => setEditing((p) => ({ ...p, location: e.target.value as LocationType }))}>
                  {LOCATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Brand</label><input className="field" value={editing.brand} onChange={(e) => setEditing((p) => ({ ...p, brand: e.target.value }))} /></div>
              <div><label className="label">Model</label><input className="field" value={editing.model} onChange={(e) => setEditing((p) => ({ ...p, model: e.target.value }))} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Serial number</label><input className="field" value={editing.serial_number} onChange={(e) => setEditing((p) => ({ ...p, serial_number: e.target.value }))} /></div>
              <div><label className="label">Barcode / QR value</label><input className="field" value={editing.barcode} onChange={(e) => setEditing((p) => ({ ...p, barcode: e.target.value }))} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Status</label>
                <select className="field" value={editing.status} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value as GearStatus }))}>
                  {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div><label className="label">Replacement value (CAD)</label><input className="field" type="number" value={editing.replacement_value} onChange={(e) => setEditing((p) => ({ ...p, replacement_value: e.target.value }))} /></div>
            </div>
            <div><label className="label">Image URL</label><input className="field" value={editing.image_url} onChange={(e) => setEditing((p) => ({ ...p, image_url: e.target.value }))} placeholder="Optional thumbnail URL" /></div>
            <div><label className="label">Notes</label><textarea className="field min-h-24" value={editing.notes} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} /></div>
            {error ? <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">{error}</div> : null}
            <div className="flex gap-2">
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing.id ? 'Update item' : 'Create item'}</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(emptyForm)}>Reset</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
