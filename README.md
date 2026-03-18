# Legal Document Analyzer

AI-assisted contract analyzer that highlights key clauses, assigns risk levels, and links each clause to cited lines in the document.

Disclaimer: AI-assisted, may be inaccurate, not legal advice.

**Features**
- Upload PDF, DOCX, or TXT (client-side parsing).
- Clause taxonomy with filters (Termination, Indemnity, Liability, Confidentiality, etc.).
- Risk score per clause (low, medium, high).
- Line-based citations and in-document highlights.
- Export annotated PDF.
- Clear loading, empty, error, and success states.

**Scope**
- Best on digitally generated, structured agreements.
- Optimized for NDA, service, consulting, and rental or lease-style agreements.
- Includes a preprocessing quality gate and block preview before AI analysis.
- Image-based, weakly structured, or poorly extracted documents may be warned on or rejected before analysis.
- Not designed to support every legal PDF shape.

**Tech Stack**
- React + Vite
- Tailwind CSS
- pdfjs-dist + mammoth for parsing
- html2pdf.js for export
- Serverless API (Vercel-style function in `api/analyze.js`)

**Local Setup**
1. Install dependencies.

```bash
npm install
```

2. Create `.env` from the example.

```bash
cp .env.example .env
```

3. Set environment variables.

Frontend:
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_API_BASE_URL` (optional, defaults to same origin)
- `VITE_USE_MOCK_ANALYZER` (optional, set `true` for local mock data)

Backend:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RATE_LIMIT_PREFIX` (optional, defaults to `legal-doc-analyzer`)

**Run Locally**
Option A (recommended): run the serverless API with Vercel dev and point the frontend to it.
1. Start the API server.

```bash
npx vercel dev --listen 3000
```

2. In another terminal, run the frontend.

```bash
npm run dev
```

3. Set `VITE_API_BASE_URL=http://localhost:3000` in `.env`.

Option B: deploy the API and set `VITE_API_BASE_URL` to your deployed domain.

**API Contract**
The backend returns stable JSON:

```json
{
  "clauses": [
    {
      "type": "Termination",
      "risk": "medium",
      "explanation": "...",
      "citations": [12, 13]
    }
  ],
  "summary": "..."
}
```

**Security Notes**
- The OpenAI API key is never exposed to the client.
- Turnstile verification is enforced in the backend.
- Rate limit: 5 requests per 30 minutes per client (Upstash Redis).
- Secrets must live in backend environment variables only.

**Deployment (Vercel)**
1. Import the repo in Vercel.
2. Add frontend env vars for your deployed app.
3. Add backend env vars (OpenAI key + Turnstile secret).
4. Deploy. The frontend will call `/api/analyze` by default, or your `VITE_API_BASE_URL` if set.

**Disclaimer**
AI-assisted, may be inaccurate, not legal advice.
