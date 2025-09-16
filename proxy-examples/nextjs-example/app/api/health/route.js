export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const endpoint = process.env.PROMPTQL_API_ENDPOINT; // e.g. promptql.ddn.hasura.app:443
    const apiKey = process.env.PROMPTQL_API_KEY;
    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: set PROMPTQL_API_ENDPOINT and PROMPTQL_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = `https://${endpoint}/playground/healthz`;
    const res = await fetch(url, {
      method: "GET",
    });

    const body = await res.text();
    const isJson = res.headers.get("content-type")?.includes("application/json");
    return new Response(isJson ? body : JSON.stringify({ raw: body }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
