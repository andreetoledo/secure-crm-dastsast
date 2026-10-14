'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Button, Card, StatusPill, PriorityPill, inputCls } from '@/components/ui';
import { api } from '@/lib/api';
import type { Ticket } from '@secure-crm/shared';

function TicketsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(query: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.tickets(query);
      setTickets(res.tickets);
      setActiveQuery(res.query);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const queryParam = q ? `?q=${encodeURIComponent(q)}` : '';
    router.replace(`/tickets${queryParam}`);
    load(q);
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-uvg-graphite/70">Gestiona las solicitudes de soporte.</p>
        </div>
        <Link href="/tickets/new"><Button>Nuevo ticket</Button></Link>
      </div>

      <form onSubmit={submit} className="mb-5 flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder="Buscar por título, descripción o cliente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="subtle">Buscar</Button>
      </form>

      {activeQuery && (
        <p className="mb-4 text-sm text-uvg-graphite/70">
          Resultados para{' '}
          {/* El término de búsqueda se refleja sin sanitizar (renderizado como HTML). */}
          <span className="font-medium text-ink" dangerouslySetInnerHTML={{ __html: `“${activeQuery}”` }} />
        </p>
      )}

      {error && <Card className="p-4 text-sm text-red-700">{error}</Card>}

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-uvg-green/20 border-t-uvg-green" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="grid place-items-center gap-1.5 py-16 text-center">
          <p className="text-sm font-medium text-ink">No hay tickets</p>
          <p className="text-sm text-uvg-graphite/60">Ajusta la búsqueda o crea uno nuevo.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[3rem_1fr_8rem_8rem_9rem] gap-4 border-b border-uvg-green/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-uvg-graphite/50 sm:grid">
            <span>#</span><span>Asunto</span><span>Prioridad</span><span>Estado</span><span>Asignado a</span>
          </div>
          <ul className="divide-y divide-uvg-green/8">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="grid grid-cols-[3rem_1fr] items-center gap-4 px-5 py-3.5 transition hover:bg-uvg-green/4 sm:grid-cols-[3rem_1fr_8rem_8rem_9rem]"
                >
                  <span className="tabular font-mono text-xs text-uvg-graphite/45">#{t.id}</span>
                  <div className="min-w-0">
                    {/* Título sin sanitizar -> XSS almacenado si se guarda un payload. */}
                    <div className="truncate text-sm font-medium text-ink" dangerouslySetInnerHTML={{ __html: t.title }} />
                    <div className="truncate text-xs text-uvg-graphite/60">{t.customerName}</div>
                  </div>
                  <span className="hidden sm:block"><PriorityPill priority={t.priority} /></span>
                  <span className="hidden sm:block"><StatusPill status={t.status} /></span>
                  <span className="hidden truncate text-[13px] text-uvg-graphite/80 sm:block">{t.assigneeName ?? 'Sin asignar'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}

export default function TicketsPage() {
  return (
    <Suspense>
      <TicketsInner />
    </Suspense>
  );
}
