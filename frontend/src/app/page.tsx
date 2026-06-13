"use client";
import { useState, useEffect } from "react";
import { client, CONTRACT_ADDRESS } from "@/lib/genlayer";

type Appraisal = {
  id: string; requester: string; domain: string; fee: string;
  status: number; valuation: string; created_at: number;
};

export default function Home() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"browse" | "create">("browse");
  const [selected, setSelected] = useState<Appraisal | null>(null);
  const [form, setForm] = useState({ domain: "", fee: "1" });
  const [tx, setTx] = useState("");

  useEffect(() => { if (CONTRACT_ADDRESS) load(); }, []);

  async function load() {
    try {
      const count = Number(await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: "get_appraisal_count", args: [] }));
      const loaded: Appraisal[] = [];
      for (let i = 1; i <= count; i++) {
        const raw = await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: "get_appraisal", args: [String(i)] });
        loaded.push(JSON.parse(raw as string));
      }
      setAppraisals(loaded);
    } catch (e) { console.error(e); }
  }

  async function send(fn: string, args: any[], value?: bigint) {
    setLoading(true); setTx(`${fn}...`);
    try {
      const hash = await client.writeContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName: fn, args, ...(value ? { value } : {}) });
      await client.waitForTransactionReceipt({ hash });
      setTx("✓ Done!"); await load(); setSelected(null);
    } catch (e: any) { setTx(`Error: ${e.message}`); }
    setLoading(false);
  }

  const gradeColor = (g: string) => ({ A: "#4caf50", B: "#8bc34a", C: "#ff9800", D: "#ff5722", F: "#f44336" }[g] || "#888");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "center" }}>🌐 DomainAppraiser</h1>
      <p style={{ textAlign: "center", color: "#888" }}>AI-powered domain valuations verified by consensus</p>

      {tx && <div style={{ background: "#1a1a2e", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{tx}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => { setTab("browse"); setSelected(null); }} style={tabBtn(tab === "browse")}>Appraisals</button>
        <button onClick={() => { setTab("create"); setSelected(null); }} style={tabBtn(tab === "create")}>Appraise Domain</button>
      </div>

      {tab === "create" && (
        <form onSubmit={e => { e.preventDefault(); send("request_appraisal", [form.domain], BigInt(form.fee) * BigInt(10**18)); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Domain name (e.g. example.com)" value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} required style={inp} />
          <input placeholder="Fee (GEN)" type="number" min="1" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} required style={inp} />
          <button type="submit" disabled={loading} style={btn}>🌐 Request Appraisal</button>
        </form>
      )}

      {tab === "browse" && !selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {appraisals.length === 0 && <p style={{ color: "#888" }}>No appraisals yet.</p>}
          {appraisals.map(a => (
            <div key={a.id} onClick={() => setSelected(a)} style={{ background: "#1a1a2e", padding: 16, borderRadius: 8, cursor: "pointer", border: "1px solid #333" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{a.domain}</strong>
                <span style={{ background: a.status === 1 ? "#4caf50" : "#ff9800", padding: "4px 10px", borderRadius: 12, fontSize: 12 }}>{a.status === 0 ? "Pending" : "Valued"}</span>
              </div>
              {a.valuation && (() => { const v = JSON.parse(a.valuation); return <small style={{ color: "#aaa" }}>Grade: <span style={{ color: gradeColor(v.grade) }}>{v.grade}</span> • ${v.estimated_value_usd.toLocaleString()} - ${v.estimated_value_high_usd.toLocaleString()}</small>; })()}
            </div>
          ))}
        </div>
      )}

      {tab === "browse" && selected && (
        <div style={{ background: "#1a1a2e", padding: 24, borderRadius: 12, border: "1px solid #333" }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#6c5ce7", cursor: "pointer" }}>← Back</button>
          <h2>{selected.domain}</h2>

          {selected.valuation && (() => {
            const v = JSON.parse(selected.valuation);
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 48, color: gradeColor(v.grade) }}>{v.grade}</span>
                  <div>
                    <div style={{ fontSize: 24 }}>${v.estimated_value_usd.toLocaleString()} — ${v.estimated_value_high_usd.toLocaleString()}</div>
                    <small style={{ color: "#888" }}>Estimated market value</small>
                  </div>
                </div>
                <p>{v.summary}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#12122a", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "#4caf50" }}>Strengths</strong>
                    <ul style={{ margin: "8px 0", paddingLeft: 16 }}>{v.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div style={{ background: "#12122a", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "#f44336" }}>Weaknesses</strong>
                    <ul style={{ margin: "8px 0", paddingLeft: 16 }}>{v.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
                  </div>
                </div>
                {v.comparable_sales && <p style={{ marginTop: 12, color: "#aaa" }}><strong>Comparables:</strong> {v.comparable_sales}</p>}
              </div>
            );
          })()}

          {selected.status === 0 && (
            <button onClick={() => send("appraise", [selected.id])} disabled={loading} style={{ ...btn, marginTop: 16 }}>🔍 Run AI Appraisal</button>
          )}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: 12, borderRadius: 8, border: "1px solid #333", background: "#1a1a2e", color: "#e0e0e0", fontSize: 14 };
const btn: React.CSSProperties = { padding: "12px 20px", borderRadius: 8, border: "none", background: "#6c5ce7", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: "bold" };
const tabBtn = (a: boolean): React.CSSProperties => ({ padding: "10px 20px", background: a ? "#6c5ce7" : "#2d2d2d", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" });
