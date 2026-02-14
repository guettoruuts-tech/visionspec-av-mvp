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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResponse | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = {
      project_name: String(formData.get('project_name')),
      client_name: String(formData.get('client_name')),
      room_name: String(formData.get('room_name')),
      viewing_distance_m: Number(formData.get('viewing_distance_m')),
      white_label: {
        company_name: String(formData.get('company_name')),
        primary_color: String(formData.get('primary_color')),
        accent_color: String(formData.get('accent_color')),
        logo_url: String(formData.get('logo_url') || '') || null
      }
    };

    const res = await fetch(`${API_URL}/studies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = (await res.json()) as StudyResponse;
    setResult(json);
    setLoading(false);
  }

  return (
    <main className="container">
      <h1>VisionSpec AV · MVP SaaS</h1>
      <p>Gerador de estudo técnico com recomendação por 4H, 6H e 8H.</p>
      <form action={onSubmit}>
        <div className="grid">
          <label>Projeto<input name="project_name" required /></label>
          <label>Cliente<input name="client_name" required /></label>
          <label>Ambiente<input name="room_name" required /></label>
          <label>Distância (m)<input name="viewing_distance_m" type="number" step="0.01" required /></label>
          <label>Empresa (white-label)<input name="company_name" required defaultValue="VisionSpec" /></label>
          <label>Cor primária<input name="primary_color" defaultValue="#111827" /></label>
          <label>Cor de destaque<input name="accent_color" defaultValue="#2563eb" /></label>
          <label>Logo URL<input name="logo_url" placeholder="https://..." /></label>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Gerando...' : 'Criar estudo'}</button>
      </form>

      {result && (
        <section>
          <h2>Resultado do estudo #{result.id}</h2>
          <table className="table">
            <thead><tr><th>Regime</th><th>TV recomendada</th><th>Distância máxima</th><th>Status</th></tr></thead>
            <tbody>
              {result.recommendations.map((item) => (
                <tr key={item.regime}>
                  <td>{item.regime}</td>
                  <td>{item.recommended_size_inches}"</td>
                  <td>{item.max_distance_m} m</td>
                  <td>{item.within_spec ? 'Dentro da especificação' : 'Acima da especificação'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <a className="link" href={`${API_URL}/studies/${result.id}/pdf`} target="_blank">Baixar PDF técnico white-label</a>
        </section>
      )}
    </main>
  );
}
