"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startConversation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: "What schema is available?" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Start failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const healthcheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/health", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Health failed (${res.status})`);
      setResult({ ok: true, upstream: data });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>PromptQL Threads v2</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={startConversation} disabled={loading} style={{ padding: 8 }}>
          {loading ? "Starting…" : "Start conversation"}
        </button>
        <button onClick={healthcheck} disabled={loading} style={{ padding: 8 }}>
          {loading ? "Checking…" : "Healthcheck"}
        </button>
      </div>
      {error && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</pre>}
      {result && <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
