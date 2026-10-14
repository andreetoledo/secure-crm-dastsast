'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Field, inputCls, StatusPill, PriorityPill } from '@/components/ui';
import { api } from '@/lib/api';
import type { Ticket } from '@secure-crm/shared';

const statuses = [
  { v: 'open', l: 'Abierto' },
  { v: 'in_progress', l: 'En progreso' },
  { v: 'closed', l: 'Cerrado' },
];
const priorities = [
  { v: 'low', l: 'Baja' },
  { v: 'medium', l: 'Media' },
  { v: 'high', l: 'Alta' },
  { v: 'urgent', l: 'Urgente' },
];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [t, setT] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.ticket(id).then(setT).catch((e) => setError(e.message));
  }, [id]);

  async function save() {
    if (!t) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateTicket(id, t);
      setT(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('¿Eliminar este ticket?')) return;
    await api.deleteTicket(id);
    router.push('/tickets');
  }

  if (error && !t) return <AppShell><Card className="p-5 text-sm text-red-700">{error}</Card></AppShell>;
  if (!t)
    return (
      <AppShell>
        <div className="grid place-items-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-uvg-green/20 border-t-uvg-green" />
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <Link href="/tickets" className="mb-5 inline-block text-sm font-medium text-uvg-green hover:underline">← Volver a tickets</Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="tabular font-mono text-sm text-uvg-graphite/45">#{t.id}</span>
              <StatusPill status={t.status} />
              <PriorityPill priority={t.priority} />
            </div>
            <div className="space-y-4">
              <Field label="Asunto">
                <input className={inputCls} value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
              </Field>
              <Field label="Descripción">
                <textarea className={`${inputCls} min-h-32 resize-y`} value={t.description} onChange={(e) => setT({ ...t, description: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-ink">Vista del cliente</h2>
            <p className="mb-3 text-xs text-uvg-graphite/60">Así se muestra el ticket en el portal público.</p>
            <div className="rounded-lg bg-uvg-green/4 p-4 ring-1 ring-uvg-green/8">
              {/* Descripción renderizada como HTML sin sanitizar (superficie de XSS). */}
              <div className="text-sm text-ink" dangerouslySetInnerHTML={{ __html: t.description }} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado">
                <select className={inputCls} value={t.status} onChange={(e) => setT({ ...t, status: e.target.value as any })}>
                  {statuses.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </Field>
              <Field label="Prioridad">
                <select className={inputCls} value={t.priority} onChange={(e) => setT({ ...t, priority: e.target.value as any })}>
                  {priorities.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-2 flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saved ? 'Guardado' : 'Guardar cambios'}
              </Button>
              <Button variant="danger" onClick={remove}>Eliminar</Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Cliente</h2>
            <dl className="space-y-2 text-sm text-uvg-graphite/80">
              <div><dt className="text-xs text-uvg-graphite/50">Nombre</dt><dd>{t.customerName}</dd></div>
              <div><dt className="text-xs text-uvg-graphite/50">Correo</dt><dd>{t.customerEmail}</dd></div>
              <div><dt className="text-xs text-uvg-graphite/50">Creado</dt><dd className="tabular">{t.createdAt}</dd></div>
            </dl>
            <div className="mt-4 border-t border-uvg-green/8 pt-3 text-[13px] text-uvg-graphite/70">
              Asignado a <span className="font-medium text-ink">{t.assigneeName ?? 'Sin asignar'}</span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
