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

          {/* Elevação frontal para o primeiro regime (4H) */}
          {result.recommendations?.[0] && (
            <ElevationVisualization recommendation={result.recommendations[0]} study={result} />
          )}

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
  recommendation,
  study,
}: {
  recommendation: Recommendation;
  study: StudyResponse;
}) {
  // Escala: 1 metro = 120 pixels
  const SCALE = 120;
  const svgWidth = 600;
  const svgHeight = 500;

  // Dimensões em pixels
  const ceilingHeightPx = study.ceiling_height_m * SCALE;
  const eyeHeightPx = study.eye_height_m * SCALE;
  const screenHeightPx = recommendation.screen_height_m * SCALE;
  const screenWidthPx = screenHeightPx * (16 / 9);

  // Posição da TV (centro ligeiramente abaixo dos olhos)
  const tvCenterY = eyeHeightPx + SCALE * 0.3; // 30cm abaixo dos olhos
  const tvTopY = tvCenterY - screenHeightPx / 2;
  const tvBottomY = tvCenterY + screenHeightPx / 2;
  const tvLeftX = (svgWidth - screenWidthPx) / 2;
  const tvRightX = tvLeftX + screenWidthPx;

  // Piso
  const floorY = svgHeight - 50;

  // Pessoa sentada
  const headRadius = SCALE * 0.11;
  const headCenterX = 80;
  const headCenterY = floorY - eyeHeightPx;

  return (
    <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Elevação Frontal</h4>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          width: '100%',
          maxWidth: 600,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        {/* Piso */}
        <line x1="0" y1={floorY} x2={svgWidth} y2={floorY} stroke="#999" strokeWidth="2" />

        {/* Parede de fundo */}
        <line
          x1={svgWidth * 0.75}
          y1="0"
          x2={svgWidth * 0.75}
          y2={floorY}
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Teto */}
        <line
          x1={svgWidth * 0.75}
          y1={floorY - ceilingHeightPx}
          x2={svgWidth}
          y2={floorY - ceilingHeightPx}
          stroke="#999"
          strokeWidth="2"
        />

        {/* Linha de altura do teto */}
        <line
          x1="0"
          y1={floorY - ceilingHeightPx}
          x2={svgWidth * 0.75}
          y2={floorY - ceilingHeightPx}
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Pessoa sentada (silhueta simplificada) */}
        {/* Cabeça */}
        <circle cx={headCenterX} cy={headCenterY} r={headRadius} fill="#8B4513" stroke="#333" strokeWidth="1.5" />

        {/* Corpo */}
        <rect
          x={headCenterX - SCALE * 0.12}
          y={headCenterY + headRadius + 5}
          width={SCALE * 0.24}
          height={SCALE * 0.4}
          fill="#8B4513"
          stroke="#333"
          strokeWidth="1.5"
        />

        {/* Pernas */}
        <line
          x1={headCenterX - SCALE * 0.1}
          y1={headCenterY + headRadius + SCALE * 0.45}
          x2={headCenterX - SCALE * 0.1}
          y2={floorY}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={headCenterX + SCALE * 0.1}
          y1={headCenterY + headRadius + SCALE * 0.45}
          x2={headCenterX + SCALE * 0.1}
          y2={floorY}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Altura dos olhos (linha de referência) */}
        <line
          x1="0"
          y1={headCenterY}
          x2={svgWidth}
          y2={headCenterY}
          stroke="#ff6b6b"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <text x="5" y={headCenterY - 5} fontSize="11" fill="#ff6b6b" fontWeight="bold">
          Altura dos olhos
        </text>

        {/* TV na parede */}
        <rect
          x={tvLeftX}
          y={floorY - tvBottomY}
          width={screenWidthPx}
          height={screenHeightPx}
          fill="#1a1a1a"
          stroke="#333"
          strokeWidth="2"
          rx="4"
        />

        {/* Beisel da TV */}
        <rect
          x={tvLeftX + 8}
          y={floorY - tvBottomY + 8}
          width={screenWidthPx - 16}
          height={screenHeightPx - 16}
          fill="#333"
          stroke="none"
        />

        {/* Etiqueta da TV com tamanho */}
        <text
          x={svgWidth / 2}
          y={floorY - tvCenterY + 20}
          fontSize="14"
          fill="#333"
          textAnchor="middle"
          style={{ fontWeight: 'bold' }}
        >
          {recommendation.recommended_size_inches}"
        </text>

        {/* Linhas de dimensão (altura da TV) */}
        <g stroke="#0066cc" strokeWidth="1.5" fill="none">
          {/* Linha esquerda */}
          <line x1={tvLeftX - 30} y1={floorY - tvTopY} x2={tvLeftX - 20} y2={floorY - tvTopY} />
          <line x1={tvLeftX - 30} y1={floorY - tvBottomY} x2={tvLeftX - 20} y2={floorY - tvBottomY} />
          <line x1={tvLeftX - 25} y1={floorY - tvTopY} x2={tvLeftX - 25} y2={floorY - tvBottomY} />

          {/* Texto da altura */}
          <text
            x={tvLeftX - 50}
            y={floorY - tvCenterY + 5}
            fontSize="12"
            fill="#0066cc"
            textAnchor="end"
            style={{ fontWeight: 'bold' }}
          >
            {recommendation.screen_height_m.toFixed(2)}m
          </text>
        </g>

        {/* Informações */}
        <text x="10" y={svgHeight - 15} fontSize="11" fill="#666">
          Escala: 1m = {SCALE}px | Regime: {recommendation.regime}
        </text>
      </svg>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <p>
          <strong>Resumo:</strong> A TV de {recommendation.recommended_size_inches}" (altura:{' '}
          {recommendation.screen_height_m.toFixed(2)}m) ficará posicionada
          {tvCenterY > headCenterY ? ' abaixo' : ' acima'} da linha dos olhos.
        </p>
      </div>
    </div>
  );
}
