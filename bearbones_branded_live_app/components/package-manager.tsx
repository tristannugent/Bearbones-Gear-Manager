'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, PackageOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stats';
import { checkoutItems, deletePackage, listGear, listPackages, savePackageItems, upsertPackage } from '@/lib/queries';
import { demoGear, demoPackages } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PACKAGE_STATUSES, type GearItem, type PackageStatus, type PackageWithItems } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const emptyForm = { id: '', name: '', project_name: '', prep_date: '', notes: '', status: 'Draft' as PackageStatus, selectedGear: [] as string[] };

export function PackageManager() {
  const [packages, setPackages] = useState<PackageWithItems[]>([]);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [editing, setEditing] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      if (isSupabaseConfigured) {
        const [packageRows, gearRows] = await Promise.all([listPackages(), listGear()]);
        setPackages(packageRows);
        setGear(gearRows);
      } else {
        setPackages(demoPackages);
        setGear(demoGear);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load packages.');
    }
  }

  useEffect(() => { void load(); }, []);

  const selectedGearItems = useMemo(() => gear.filter((item) => editing.selectedGear.includes(item.id)), [gear, editing.selectedGear]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        const saved = await upsertPackage({
          ...(editing.id ? { id: editing.id } : {}),
          name: editing.name,
          project_name: editing.project_name || null,
          prep_date: editing.prep_date || null,
          notes: editing.notes || null,
          status: editing.status,
        });
        await savePackageItems(saved.id, editing.selectedGear);
        await load();
      } else {
        const newPackage: PackageWithItems = {
          id: editing.id || Math.random().toString(36).slice(2),
          name: editing.name,
          project_name: editing.project_name || null,
          prep_date: editing.prep_date || null,
          notes: editing.notes || null,
          status: editing.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'demo',
          package_items: selectedGearItems.map((item, index) => ({ id: `pi-${index}`, package_id: editing.id || 'temp', gear_item_id: item.id, created_at: new Date().toISOString(), gear_items: item })),
        };
        setPackages((prev) => {
          const exists = prev.some((pkg) => pkg.id === newPackage.id);
          return exists ? prev.map((pkg) => pkg.id === newPackage.id ? newPackage : pkg) : [newPackage, ...prev];
        });
      }
      setEditing(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save package.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    try {
      if (isSupabaseConfigured) {
        await deletePackage(id);
        await load();
      } else {
        setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete package.');
    }
  }

  async function onCheckout(pkg: PackageWithItems) {
    const itemIds = (pkg.package_items ?? []).map((item) => item.gear_item_id);
    if (!itemIds.length) return;
    try {
      if (isSupabaseConfigured) {
        await checkoutItems({ gearItemIds: itemIds, packageId: pkg.id, assigneeName: 'Crew', projectName: pkg.project_name ?? pkg.name, dueBack: pkg.prep_date, notes: pkg.notes });
        await load();
      } else {
        alert('Package checkout is fully live when connected to Supabase.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check out package.');
    }
  }

  return (
    <div>
      <PageHeader title="Packages" subtitle="Build and save shoot-ready packages by selecting inventory items, then check the whole package out in one move." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Saved packages" value={String(packages.length)} icon={<PackageOpen className="h-4 w-4" />} />
        <StatCard label="Prepped" value={String(packages.filter((pkg) => pkg.status === 'Prepped').length)} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label="Checked out" value={String(packages.filter((pkg) => pkg.status === 'Checked Out').length)} icon={<Plus className="h-4 w-4" />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="card p-4 md:p-5">
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-2xl border border-border bg-panel2 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{pkg.name}</h3>
                      <span className="badge border-border bg-panel text-muted">{pkg.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted">Project: {pkg.project_name ?? '—'} · Prep date: {formatDate(pkg.prep_date)}</div>
                    {pkg.notes ? <p className="mt-2 text-sm text-muted">{pkg.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(pkg.package_items ?? []).map((item) => (
                        <span key={item.id} className="badge border-border bg-panel text-muted">{item.gear_items?.name ?? item.gear_item_id}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => setEditing({
                      id: pkg.id,
                      name: pkg.name,
                      project_name: pkg.project_name ?? '',
                      prep_date: pkg.prep_date ?? '',
                      notes: pkg.notes ?? '',
                      status: pkg.status,
                      selectedGear: (pkg.package_items ?? []).map((item) => item.gear_item_id),
                    })}>Edit</button>
                    <button className="btn-primary" onClick={() => void onCheckout(pkg)}>Check out</button>
                    <button className="btn-danger" onClick={() => void onDelete(pkg.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!packages.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">No packages yet.</div> : null}
          </div>
        </section>
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-xl font-semibold">{editing.id ? 'Edit package' : 'Build package'}</h2>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div><label className="label">Package name</label><input className="field" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Project name</label><input className="field" value={editing.project_name} onChange={(e) => setEditing((p) => ({ ...p, project_name: e.target.value }))} /></div>
              <div><label className="label">Prep date</label><input className="field" type="date" value={editing.prep_date} onChange={(e) => setEditing((p) => ({ ...p, prep_date: e.target.value }))} /></div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="field" value={editing.status} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value as PackageStatus }))}>
                {PACKAGE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Select gear</label>
              <div className="max-h-64 space-y-2 overflow-auto rounded-2xl border border-border bg-panel2 p-3">
                {gear.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-panel px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.selectedGear.includes(item.id)}
                      onChange={(e) => setEditing((prev) => ({
                        ...prev,
                        selectedGear: e.target.checked ? [...prev.selectedGear, item.id] : prev.selectedGear.filter((id) => id !== item.id),
                      }))}
                    />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-muted">{item.category}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="label">Notes</label><textarea className="field min-h-24" value={editing.notes} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} /></div>
            {error ? <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">{error}</div> : null}
            <div className="rounded-2xl border border-border bg-panel2 p-3 text-sm text-muted">
              <div className="mb-2 text-foreground">Selected items: {selectedGearItems.length}</div>
              {selectedGearItems.map((item) => item.name).join(', ') || 'No gear selected yet.'}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing.id ? 'Update package' : 'Create package'}</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(emptyForm)}>Reset</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
