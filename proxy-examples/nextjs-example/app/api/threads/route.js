let cachedToken = null;
let cachedExpiry = 0; // epoch seconds

async function getDdnToken() {
  const accessToken = process.env.PROMPTQL_ACCESS_TOKEN;
  const projectId = process.env.PROMPTQL_PROJECT_ID;
  const tokenUrl = process.env.PROMPTQL_TOKEN_REFRESH_URL || "https://auth.pro.hasura.io/ddn/promptql/token";

  if (!accessToken || !projectId) {
    throw new Error("Missing PROMPTQL_ACCESS_TOKEN or PROMPTQL_PROJECT_ID");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExpiry > now + 60) {
    // 60s safety margin
    return cachedToken;
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `pat ${accessToken}`,
      "x-hasura-project-id": projectId,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data?.token) throw new Error("Token response missing token");
  cachedToken = data.token;
  cachedExpiry = now + 900;
  return cachedToken;
}

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const endpoint = process.env.PROMPTQL_API_ENDPOINT;
    const apiKey = process.env.PROMPTQL_API_KEY;
    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: set PROMPTQL_API_ENDPOINT and PROMPTQL_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read incoming JSON (if any)
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      /* ignore non-JSON/empty */
    }
    if (typeof body !== "object" || body === null) body = {};
    if (typeof body.ddn_headers !== "object" || body.ddn_headers === null) body.ddn_headers = {};

    // Inject short-lived DDN token into body
    const ddnToken = await getDdnToken();
    body.ddn_headers["x-hasura-ddn-token"] = ddnToken;

    // Minimal defaults for starting a conversation
    if (!body.user_message) body.user_message = "What schema is available?";
    if (!body.timezone) body.timezone = "UTC";

    const url = `https://${endpoint}/playground/threads/v2/start`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `api-key ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    // Try to pass through JSON if possible
    const isJson = upstream.headers.get("content-type")?.includes("application/json");
    return new Response(isJson ? text : JSON.stringify({ raw: text }), {
      status: upstream.status,
      headers: { "Content-Type": isJson ? "application/json" : "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
