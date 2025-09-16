## Next.js Example

A minimal Next.js app that safely fronts the PromptQL API. It injects your PromptQL API key as the upstream
Authorization header and fetches a short‑lived Hasura DDN token at request time, injecting it into the JSON body as
`ddn_headers.x-hasura-ddn-token`. Useful to keep secrets server‑side when calling from browsers or untrusted clients.

## Quick start

### Prereqs

1. Node.js 18+ and npm installed
2. Set secrets (create a `.env.local` in this folder)

```
PROMPTQL_API_KEY=pk-xxxxxxxxxxxxxxxx
PROMPTQL_ACCESS_TOKEN=pat_xxxxxxxxxxxxxxxx        # Hasura DDN PAT or service account token
PROMPTQL_PROJECT_ID=<your-ddn-project-id>
# Optional overrides
# PROMPTQL_API_ENDPOINT=promptql.ddn.hasura.app:443
# PROMPTQL_API_HOST=promptql.ddn.hasura.app
# PROMPTQL_TOKEN_REFRESH_URL=https://auth.pro.hasura.io/ddn/promptql/token
```

3. Run the app

```
npm install
npm run dev
```

4. Health check

```
curl -sf http://localhost:3000/api/health
```

5. Start a conversation (the server adds ddn_headers and upstream Authorization for you)

```
curl --location 'http://localhost:3000/api/threads' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_message": "What schema is available?",
    "timezone": "America/Los_Angeles"
  }'
```

## How it works

High level flow:

- Client sends JSON to the Next.js API route (e.g., POST /api/threads → upstream /playground/threads/v2/start).
- The route fetches/refreshes a short‑lived DDN token (cached ~15 minutes) and injects it into
  `body.ddn_headers["x-hasura-ddn-token"]`.
- The route sets the upstream Authorization header to your API key: `Authorization: api-key <PROMPTQL_API_KEY>`.
- Request is forwarded to the PromptQL API over HTTPS. A separate GET /api/health proxies to `/playground/healthz`.

**NB: For additional functionality, you'll have to also create routes for `/playground/threads/v2/{threadId}/continue`,
`/playground/threads/v2/{threadId}/cancel`, and `/playground/threads/v2/{threadId}`.**
