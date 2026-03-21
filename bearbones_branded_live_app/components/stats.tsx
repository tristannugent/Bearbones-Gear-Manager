import { ReactNode } from 'react';

export function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-muted">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
