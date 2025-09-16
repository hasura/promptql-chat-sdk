## NGINX Example

A minimal OpenResty (NGINX+Lua) reverse proxy that safely fronts the PromptQL API. It injects your PromptQL API key as
the upstream Authorization header and fetches a short‑lived Hasura DDN token at request time, injecting it into the JSON
body as ddn_headers.x-hasura-ddn-token. Useful to keep secrets server‑side when using the SDK from browsers or untrusted
clients.

## Quick start

### Prereqs

1. Docker and Docker Compose installed
2. Set secrets (create a .env file in this folder)

```
PROMPTQL_API_KEY=pk-xxxxxxxxxxxxxxxx
PROMPTQL_ACCESS_TOKEN=pat_xxxxxxxxxxxxxxxx        # Hasura DDN PAT or service account token
PROMPTQL_PROJECT_ID=<your-ddn-project-id>
# Optional overrides
# PROMPTQL_API_ENDPOINT=promptql.ddn.hasura.app:443
# PROMPTQL_API_HOST=promptql.ddn.hasura.app
# PROMPTQL_TOKEN_REFRESH_URL=https://auth.pro.hasura.io/ddn/promptql/token
```

3. Run the proxy

```
docker compose up --build -d
```

4. Health check

```
curl -sf http://localhost:8080/health
```

5. Try a request (the proxy adds ddn_headers and upstream Authorization for you)

```
curl --location 'http://localhost:8080/playground/threads/v2/start' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_message": "What schema is available?",
    "timezone": "America/Los_Angeles"
  }'
```

Logs are written to ./logs (also streamed to container stdout/stderr). You can verify this was created by the response
and also by visiting your project's console to see the thread.

## How it works

High level flow:

- Client sends JSON to the proxy (e.g., /playground/threads/v2/start).
- access_by_lua reads the request body, fetches/refreshes a short‑lived DDN token (cached ~15 minutes), and injects it
  into body.ddn_headers["x-hasura-ddn-token"].
- NGINX strips any client Authorization header and sets the upstream one to your API key: Authorization: api-key
  <PROMPTQL_API_KEY>.
- Request is proxied to the PromptQL API over HTTPS with SSE-friendly timeouts and buffering disabled.
