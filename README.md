# VisionSpec AV MVP (SaaS)

MVP completo para geração de estudos técnicos de visualização AV em modelo SaaS, com:

- **Backend FastAPI** (`apps/api`)
- **Frontend Next.js** (`apps/web`)
- **Motor de cálculo TypeScript** (`packages/engine`) baseado na planilha `Estudo de Visualização.xlsx`
- **Base técnica extraída** para `data/base_tvs.json` (aba **BASE TVs**)
- **Cálculo 4H, 6H e 8H**
- **Endpoint de criação de estudo**
- **Endpoint de PDF técnico white-label**
- **Docker Compose** com Postgres + API + Web

## Estrutura

```bash
.
├── apps
│   ├── api
│   │   ├── app
│   │   │   ├── main.py
│   │   │   ├── engine.py
│   │   │   ├── pdf.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── database.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── web
│       ├── app
│       │   ├── page.tsx
│       │   ├── layout.tsx
│       │   └── styles.css
│       ├── package.json
│       └── Dockerfile
├── packages
│   └── engine
│       └── src
│           ├── index.ts
│           └── base_tvs.json
├── data
│   └── base_tvs.json
├── scripts
│   └── extract_base_tvs.py
└── docker-compose.yml
```

## Requisitos locais

- Docker + Docker Compose
- (Opcional) Node 20+ e Python 3.12 para rodar sem Docker

## Executar com Docker

```bash
docker compose up --build
```

Serviços:

- Web: http://localhost:3000
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## API

### `POST /studies`
Cria estudo técnico com recomendações 4H, 6H e 8H.

Exemplo:

```json
{
  "project_name": "Sala de Conselho",
  "client_name": "Empresa X",
  "room_name": "Boardroom 12º andar",
  "viewing_distance_m": 3.2,
  "white_label": {
    "company_name": "Integrador X",
    "primary_color": "#111827",
    "accent_color": "#2563eb",
    "logo_url": "https://exemplo.com/logo.png"
  }
}
```

### `GET /studies/{id}/pdf`
Gera PDF técnico white-label com dados do estudo e recomendação por regime.

## Extração da BASE TVs

Arquivo-fonte: `Estudo de Visualização.xlsx` (aba **BASE TVs**).

Para regenerar `data/base_tvs.json`:

```bash
python scripts/extract_base_tvs.py
```

## Rodar sem Docker (opcional)

### Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='postgresql+psycopg2://visionspec:visionspec@localhost:5432/visionspec'
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Engine (teste)

```bash
npm install
npm run test:engine
```
