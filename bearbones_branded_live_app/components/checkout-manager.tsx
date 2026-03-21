'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stats';
import { checkoutItems, listCheckouts, listGear, returnCheckout } from '@/lib/queries';
import { demoCheckouts, demoGear } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { CheckoutWithGear, GearItem } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

export function CheckoutManager() {
  const [checkouts, setCheckouts] = useState<CheckoutWithGear[]>([]);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [selectedGearId, setSelectedGearId] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [dueBack, setDueBack] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      if (isSupabaseConfigured) {
        const [checkoutRows, gearRows] = await Promise.all([listCheckouts(), listGear()]);
        setCheckouts(checkoutRows);
        setGear(gearRows);
      } else {
        setCheckouts(demoCheckouts);
        setGear(demoGear);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load checkouts.');
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGearId) return;
    try {
      if (isSupabaseConfigured) {
        await checkoutItems({ gearItemIds: [selectedGearId], assigneeName, projectName, dueBack, notes });
        await load();
      } else {
        alert('Single-item checkout becomes live once Supabase is connected.');
      }
      setSelectedGearId('');
      setAssigneeName('');
      setProjectName('');
      setDueBack('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check out item.');
    }
  }

  async function handleReturn(checkout: CheckoutWithGear) {
    try {
      if (isSupabaseConfigured) {
        await returnCheckout(checkout.id, checkout.gear_item_id, checkout.package_id);
        await load();
      } else {
        alert('Returns become live once Supabase is connected.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not return item.');
    }
  }

  const openCheckouts = checkouts.filter((item) => !item.returned_at);

  return (
    <div>
      <PageHeader title="Checkouts" subtitle="Check individual items out to crew or clients, track due-back dates, and return gear back into available inventory." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Open checkouts" value={String(openCheckouts.length)} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label="Returned" value={String(checkouts.filter((c) => c.returned_at).length)} icon={<RotateCcw className="h-4 w-4" />} />
        <StatCard label="Checked out today" value={String(checkouts.length)} icon={<ClipboardCheck className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-xl font-semibold">Quick checkout</h2>
          <form className="grid gap-3" onSubmit={handleCheckout}>
            <div>
              <label className="label">Gear item</label>
              <select className="field" value={selectedGearId} onChange={(e) => setSelectedGearId(e.target.value)} required>
                <option value="">Select item</option>
                {gear.filter((item) => item.status === 'Available').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div><label className="label">Assigned to</label><input className="field" value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} placeholder="Crew member / client" /></div>
            <div><label className="label">Project</label><input className="field" value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
            <div><label className="label">Due back</label><input className="field" type="date" value={dueBack} onChange={(e) => setDueBack(e.target.value)} /></div>
            <div><label className="label">Notes</label><textarea className="field min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            {error ? <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">{error}</div> : null}
            <button className="btn-primary">Check out item</button>
          </form>
        </section>
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 text-xl font-semibold">Checkout log</h2>
          <div className="space-y-3">
            {checkouts.map((checkout) => (
              <div key={checkout.id} className="rounded-2xl border border-border bg-panel2 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{checkout.gear_items?.name ?? checkout.gear_item_id}</h3>
                      <span className="badge border-border bg-panel text-muted">{checkout.gear_items?.category ?? 'gear'}</span>
                      <span className="badge border-border bg-panel text-muted">{checkout.returned_at ? 'Returned' : 'Open'}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      Assigned to: {checkout.assignee_name ?? '—'} · Project: {checkout.project_name ?? '—'}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      Out: {formatDateTime(checkout.checked_out_at)} · Due: {formatDate(checkout.due_back)}
                    </div>
                    {checkout.notes ? <p className="mt-2 text-sm text-muted">{checkout.notes}</p> : null}
                  </div>
                  {!checkout.returned_at ? <button className="btn-secondary" onClick={() => void handleReturn(checkout)}>Return item</button> : null}
                </div>
              </div>
            ))}
            {!checkouts.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">No checkout history yet.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
