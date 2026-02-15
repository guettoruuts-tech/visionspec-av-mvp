'use client';

import { useState, useEffect } from 'react';

type Recommendation = {
  regime: string;
  recommended_size_inches: number;
  recommended_diagonal_inches: number;
  screen_height_m: number;
  max_distance_m: number;
  within_spec: boolean;
  fits_ceiling: boolean;
};

type StudyResponse = {
  id: number;
  project_name: string;
  client_name: string;
  room_name: string;
  viewing_distance_m: number;
  eye_height_m: number;
  ceiling_height_m: number;
  recommendations: Recommendation[];
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [specs, setSpecs] = useState<any[]>([]);

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
      eye_height_m: Number(fd.get('eye_height_m') ?? 1.7),
      ceiling_height_m: Number(fd.get('ceiling_height_m') ?? 2.8),

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
      // fetch base specs to display
      try {
        const s = await fetch('/api/specs');
        if (s.ok) setSpecs(await s.json());
      } catch (err) {
        /* ignore */
      }
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

          <Field
            label="Altura dos olhos (m)"
            name="eye_height_m"
            defaultValue="1.7"
            type="number"
            step="0.1"
          />
          <Field
            label="Pé direito (m)"
            name="ceiling_height_m"
            defaultValue="2.8"
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
      {specs.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Tabela técnica (amostra)</h3>
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>Polegadas</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Diag (m)</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Dist. 4H (m)</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Dist. 6H (m)</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Dist. 8H (m)</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: 6 }}>{s.size_inches}</td>
                    <td style={{ padding: 6 }}>{(s.diagonal_inches * 0.0254).toFixed(3)}</td>
                    <td style={{ padding: 6 }}>{s.distance_4h_m}</td>
                    <td style={{ padding: 6 }}>{s.distance_6h_m}</td>
                    <td style={{ padding: 6 }}>{s.distance_8h_m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
            <div>
              <strong>Altura dos olhos:</strong> {result.eye_height_m} m
            </div>
            <div>
              <strong>Pé direito:</strong> {result.ceiling_height_m} m
            </div>
          </div>

          <h3 style={{ marginTop: 14, fontSize: 16, fontWeight: 800 }}>Recomendações</h3>
          <ul style={{ marginTop: 8 }}>
            {result.recommendations?.map((r, idx) => (
              <li key={idx}>
                <strong>{r.regime}</strong>: {r.recommended_size_inches}" {r.fits_ceiling ? '✓' : '✗'} (altura: {r.screen_height_m}m, máx. {r.max_distance_m}m)
              </li>
            ))}
          </ul>

          {/* Elevação frontal comparando os 3 regimes */}
          {result.recommendations && <ElevationVisualization study={result} />}

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

function ElevationVisualization({
  study,
}: {
  study: StudyResponse;
}) {
  // Escala: 1 metro = 100 pixels
  const SCALE = 100;
  const svgWidth = 900;
  const svgHeight = 450;
  const padding = 60;

  // Dimensões em metros
  const ceilingHeightPx = study.ceiling_height_m * SCALE;
  const eyeHeightPx = study.eye_height_m * SCALE;

  // Piso
  const floorY = svgHeight - padding;

  // Renderizar 3 TVs (4H, 6H, 8H)
  const tvs = study.recommendations.map((rec, idx) => {
    const screenHeightPx = rec.screen_height_m * SCALE;
    const screenWidthPx = screenHeightPx * (16 / 9);

    // Posicionar TVs lado a lado
    const xSpacing = (svgWidth - padding * 2) / 3;
    const tvCenterX = padding + (idx + 0.5) * xSpacing;
    const tvLeftX = tvCenterX - screenWidthPx / 2;

    // TV posicionada 30cm abaixo dos olhos
    const tvCenterY = eyeHeightPx + SCALE * 0.3;
    const tvTopY = tvCenterY - screenHeightPx / 2;
    const tvBottomY = tvCenterY + screenHeightPx / 2;

    return { rec, idx, screenHeightPx, screenWidthPx, tvLeftX, tvTopY, tvBottomY, tvCenterY, tvCenterX };
  });

  return (
    <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Elevação Frontal - Comparação 4H, 6H, 8H</h4>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        {/* Piso */}
        <line x1="0" y1={floorY} x2={svgWidth} y2={floorY} stroke="#999" strokeWidth="2" />

        {/* Altura do teto */}
        <line x1="0" y1={floorY - ceilingHeightPx} x2={svgWidth} y2={floorY - ceilingHeightPx} stroke="#999" strokeWidth="2" />
        <line x1="0" y1={floorY - ceilingHeightPx} x2={svgWidth} y2={floorY - ceilingHeightPx} stroke="#d1d5db" strokeWidth="1" strokeDasharray="5,5" />

        {/* Linha de altura dos olhos (referência) */}
        <line
          x1="0"
          y1={floorY - eyeHeightPx}
          x2={svgWidth}
          y2={floorY - eyeHeightPx}
          stroke="#ff6b6b"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text x="5" y={floorY - eyeHeightPx - 8} fontSize="12" fill="#ff6b6b" style={{ fontWeight: 'bold' }}>
          Altura dos olhos ({study.eye_height_m}m)
        </text>

        {/* TVs */}
        {tvs.map(({ rec, idx, screenHeightPx, screenWidthPx, tvLeftX, tvTopY, tvBottomY, tvCenterY, tvCenterX }) => {
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];
          const color = colors[idx];

          return (
            <g key={idx}>
              {/* TV */}
              <rect
                x={tvLeftX}
                y={floorY - tvBottomY}
                width={screenWidthPx}
                height={screenHeightPx}
                fill="#000"
                stroke={color}
                strokeWidth="3"
                rx="4"
              />

              {/* Beira da TV */}
              <rect
                x={tvLeftX + 5}
                y={floorY - tvBottomY + 5}
                width={screenWidthPx - 10}
                height={screenHeightPx - 10}
                fill="#1a1a1a"
                stroke="none"
              />

              {/* Rótulo do regime */}
              <text
                x={tvCenterX}
                y={floorY - tvCenterY}
                fontSize="16"
                fill="#fff"
                textAnchor="middle"
                style={{ fontWeight: 'bold', pointerEvents: 'none' }}
              >
                {rec.recommended_size_inches}"
              </text>

              {/* Nome do regime abaixo */}
              <text
                x={tvCenterX}
                y={floorY + 25}
                fontSize="13"
                fill={color}
                textAnchor="middle"
                style={{ fontWeight: 'bold' }}
              >
                {rec.regime}
              </text>

              {/* Altura em metros */}
              <text
                x={tvLeftX - 15}
                y={floorY - (tvTopY + tvBottomY) / 2 + 5}
                fontSize="11"
                fill="#666"
                textAnchor="end"
              >
                {rec.screen_height_m.toFixed(2)}m
              </text>

              {/* Linha de dimensão vertical (opcional) */}
              <line
                x1={tvLeftX - 8}
                y1={floorY - tvTopY}
                x2={tvLeftX - 3}
                y2={floorY - tvTopY}
                stroke="#666"
                strokeWidth="1"
              />
              <line
                x1={tvLeftX - 8}
                y1={floorY - tvBottomY}
                x2={tvLeftX - 3}
                y2={floorY - tvBottomY}
                stroke="#666"
                strokeWidth="1"
              />
              <line x1={tvLeftX - 5.5} y1={floorY - tvTopY} x2={tvLeftX - 5.5} y2={floorY - tvBottomY} stroke="#666" strokeWidth="1" />
            </g>
          );
        })}

        {/* Info de escala */}
        <text x={svgWidth - 5} y={svgHeight - 5} fontSize="10" fill="#999" textAnchor="end">
          Escala: 1m = {SCALE}px
        </text>
      </svg>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <p>
          <strong>Comparação Visual:</strong> As três opções de regime (4H, 6H, 8H) com seus respectivos tamanhos de TV recomendados. Todas posicionadas ~30cm abaixo da linha dos olhos conforme norma AVIXA.
        </p>
      </div>
    </div>
  );
}
