'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { api, saveSession } from '@/lib/api';
import { BrandPair, Logo, UvgLogo } from '@/components/brand';
import { Button, Field, inputCls } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await api.login(username, password);
      saveSession(auth);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center justify-between bg-uvg-deep px-5 py-3.5 lg:hidden">
        <BrandPair logoClassName="h-6 w-auto" uvgClassName="h-6 w-auto" />
      </div>

      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-uvg-deep p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,#a8f0c8,transparent_70%)] opacity-25 blur-3xl"
        />
        <Logo className="h-8 w-auto" />
        <div className="relative max-w-md">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight">
            Mesa de soporte y gestión de tickets
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            Centraliza las solicitudes de tus clientes, asígnalas a tu equipo y da seguimiento
            hasta su resolución.
          </p>
        </div>
        <div className="relative space-y-3">
          <UvgLogo className="h-9 w-auto" />
          <p className="text-xs text-white/45">Desarrollo de Software Seguro</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-[var(--paper)] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Iniciar sesión</h2>
          <p className="mt-1.5 text-sm text-uvg-graphite/70">Accede con tu cuenta corporativa.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Usuario">
              <input
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </Field>
            <Field label="Contraseña">
              <input
                className={inputCls}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="mt-8 text-xs leading-relaxed text-uvg-graphite/55">
            ¿Problemas para ingresar? Contacta al administrador del sistema.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
