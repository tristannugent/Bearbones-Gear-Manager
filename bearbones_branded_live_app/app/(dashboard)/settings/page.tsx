import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Branding and deployment notes for your live Bearbones Gear Manager build." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-semibold">Brand styling included</h2>
          <div className="space-y-3 text-sm text-muted">
            <p>This build now includes your Bearbones logos in <code>public/branding</code>, plus a monochrome dark UI palette matched to the artwork.</p>
            <p>The active app icon is generated from the skeleton bear mark, and the sidebar/login screens now use your real brand assets instead of a placeholder lockup.</p>
            <p>If you want to fine-tune the theme later, update <code>lib/brand.ts</code>, <code>app/globals.css</code>, and <code>components/logo.tsx</code>.</p>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-xl font-semibold">Go live checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Create a Supabase project and run <code>supabase_schema.sql</code>.</li>
            <li>Copy <code>.env.example</code> to <code>.env.local</code> and add your keys.</li>
            <li>Run <code>npm install</code> then <code>npm run dev</code>.</li>
            <li>Deploy to Vercel and add the same environment variables.</li>
            <li>Create your owner account, then start loading gear and packages.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
