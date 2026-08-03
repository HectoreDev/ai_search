import { useState } from "react";

type ApiResponse = {
  message: string;
};

export default function App() {
  const [message, setMessage] = useState("Aún no se ha consultado la API.");
  const [loading, setLoading] = useState(false);

  async function callApi() {
    setLoading(true);

    try {
      const response = await fetch("/api/hello");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as ApiResponse;
      setMessage(data.message);
    } catch (error) {
      setMessage(`No fue posible conectar con el Worker: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="card">
        <span className="eyebrow">Vite + Cloudflare Workers</span>
        <h1>Frontend y backend, un solo proyecto.</h1>
        <p>{message}</p>
        <button onClick={callApi} disabled={loading}>
          {loading ? "Consultando…" : "Probar API"}
        </button>
      </section>
    </main>
  );
}
