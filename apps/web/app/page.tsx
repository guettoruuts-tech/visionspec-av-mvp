'use client';

import { useState } from 'react';

type Recommendation = {
  regime: string;
  recommended_size_inches: number;
  max_distance_m: number;
  within_spec: boolean;
};

type StudyResponse = {
  id: number;
  project_name: string;
  client_name: string;
  room_name: string;
  viewing_distance_m: number;
  recommendations: Recommendation[];
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData(e.currentTarget);

    const payload = {
      project_name: String(fd.get('project_name') ?? ''),
      client_name: String(fd.get('client_name') ?? ''),
      room_name: String(fd.get('room_name') ?? ''),
      viewing_distance_m: Number(fd.get('viewing_distance_m') ?? 0),

      white_label: {
        company_name: String(fd.get('company_name') ?? 'VisionSpec'),
        primary_color: String(fd.get('primary_color') ?? '#111827'),
        accent_color: String(fd.get('accent_color') ?? '#2563eb'),
        logo_url: String(fd.get('logo_url') ?? ''),
      },
    };

    try {
      const res = await fetch('/api/studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API retornou ${res.status}. ${text}`);
      }

      const data = (await res.json()) as StudyResponse;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800 }}>VisionSpec AV · MVP SaaS</h1>
      <p style={{ marginTop: 8, color: '#555' }}>
        Gerador de estudo técnico com recomendação por 4H, 6H e 8H.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 24,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Projeto" name="project_name" placeholder="Ex.: Boardroom 25º" />
          <Field label="Cliente" name="client_name" placeholder="Ex.: Cliente X" />

          <Field label="Ambiente" name="room_name" placeholder="Ex.: Sala 01" />
          <Field
            label="Distância (m)"
            name="viewing_distance_m"
            placeholder="Ex.: 3.2"
            type="number"
            step="0.1"
          />

          <Field label="Empresa (white-label)" name="company_name" defaultValue="VisionSpec" />
          <Field label="Cor primária" name="primary_color" defaultValue="#111827" />

          <Field label="Cor de destaque" name="accent_color" defaultValue="#2563eb" />
          <Field label="Logo URL" name="logo_url" placeholder="https://..." />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 18,
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Criando...' : 'Criar estudo'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, color: '#b91c1c' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {result && (
        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Resultado</h2>

          <div style={{ marginTop: 8 }}>
            <div>
              <strong>Projeto:</strong> {result.project_name}
            </div>
            <div>
              <strong>Cliente:</strong> {result.client_name}
            </div>
            <div>
              <strong>Ambiente:</strong> {result.room_name}
            </div>
            <div>
              <strong>Distância:</strong> {result.viewing_distance_m} m
            </div>
          </div>

          <h3 style={{ marginTop: 14, fontSize: 16, fontWeight: 800 }}>Recomendações</h3>
          <ul style={{ marginTop: 8 }}>
            {result.recommendations?.map((r, idx) => (
              <li key={idx}>
                <strong>{r.regime}</strong>: {r.recommended_size_inches}" (máx. {r.max_distance_m}m) —{' '}
                {r.within_spec ? 'OK' : 'Fora'}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 14 }}>
            <a
              href={`/api/studies/${result.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontWeight: 700 }}
            >
              Baixar PDF (white-label)
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        type={type}
        step={step}
        style={{
          height: 40,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          padding: '0 12px',
        }}
      />
    </label>
  );
}
