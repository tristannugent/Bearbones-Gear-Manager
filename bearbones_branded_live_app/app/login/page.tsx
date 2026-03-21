'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { signIn, signUp } from '@/lib/queries';
import { brand } from '@/lib/brand';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!isSupabaseConfigured) {
        setMessage('Add your Supabase URL and anon key to .env.local to enable login. Demo mode is visible after setup.');
        return;
      }
      if (mode === 'login') {
        await signIn(email, password);
        router.push('/inventory');
      } else {
        await signUp(email, password, fullName);
        setMessage('Account created. Check your email if confirmation is enabled, then sign in.');
        setMode('login');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
      <div className="grid w-full gap-6 md:grid-cols-[1.1fr,0.9fr]">
        <div className="card relative overflow-hidden p-8 md:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/[0.03] to-transparent md:block" />
          <div className="relative z-10">
            <div className="mb-8"><Logo /></div>
            <h1 className="max-w-2xl text-4xl font-semibold">Production inventory that looks and feels like Bearbones.</h1>
            <p className="mt-4 max-w-xl text-muted">
              Organize cameras, lenses, lighting, audio, grip, props, and miscellaneous kit. Prep packages, check gear in and out, and keep office, studio, and on-set locations accurate across every device.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Live inventory', 'Shoot package prep', 'Cloud sync + mobile'].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-panel2 p-4 text-sm text-foreground">{item}</div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-16 right-0 hidden w-[230px] opacity-20 md:block lg:w-[300px]">
            <Image
              src={brand.assets.mark}
              alt="Bearbones skeleton bear mark"
              width={1449}
              height={1449}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </div>
        <div className="card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-panel2 p-2">
              <Image src={brand.assets.mark} alt="Bearbones mark" width={64} height={64} className="h-10 w-10 object-contain" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-muted">Crew access</div>
              <div className="text-lg font-semibold text-foreground">Sign in to your gear hub</div>
            </div>
          </div>
          <div className="mb-6 flex gap-2">
            <button className={mode === 'login' ? 'btn-primary flex-1' : 'btn-secondary flex-1'} onClick={() => setMode('login')}>Sign in</button>
            <button className={mode === 'signup' ? 'btn-primary flex-1' : 'btn-secondary flex-1'} onClick={() => setMode('signup')}>Create account</button>
          </div>
          <form className="grid gap-4" onSubmit={onSubmit}>
            {mode === 'signup' ? (
              <div>
                <label className="label">Full name</label>
                <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} required={mode === 'signup'} />
              </div>
            ) : null}
            <div>
              <label className="label">Email</label>
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            {message ? <div className="rounded-xl border border-border bg-panel2 p-3 text-sm text-muted">{message}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}
