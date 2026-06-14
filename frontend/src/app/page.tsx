"use client";
import { useState, useEffect, useCallback } from "react";
import { CONTRACT_ADDRESS, connectWallet, readClient, shortAddr, type WalletState } from "@/lib/genlayer";
import { TransactionStatus } from "genlayer-js/types";

type Appraisal = { id: string; requester: string; domain: string; fee: string; status: number; valuation: string; };

const gradeColor = (g: string) => ({ A: "#059669", B: "#0d9488", C: "#d97706", D: "#ea580c", F: "#dc2626" }[g] || "#64748b");

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>({ address: null, client: null });
  const [items, setItems] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"browse" | "create">("browse");
  const [selected, setSelected] = useState<Appraisal | null>(null);
  const [form, setForm] = useState({ domain: "", fee: "1" });
  const [tx, setTx] = useState("");

  const load = useCallback(async () => {
    try {
      const rc = readClient();
      const count = Number(await rc.readContract({ address: CONTRACT_ADDRESS, functionName: "get_appraisal_count", args: [] }));
      const out: Appraisal[] = [];
      for (let i = 1; i <= count; i++) {
        const raw = await rc.readContract({ address: CONTRACT_ADDRESS, functionName: "get_appraisal", args: [String(i)] });
        out.push(JSON.parse(raw as string));
      }
      setItems(out.reverse());
    } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleConnect() {
    setTx("Connecting…");
    try { const w = await connectWallet(); setWallet(w); setTx(`Connected · ${shortAddr(w.address!)}`); }
    catch (e: any) { setTx(`⚠ ${e.message}`); }
  }

  async function send(fn: string, args: any[], value?: bigint) {
    if (!wallet.client) { setTx("⚠ Connect your wallet first"); return; }
    setLoading(true); setTx(`Running ${fn}…`);
    try {
      const hash = await wallet.client.writeContract({ address: CONTRACT_ADDRESS, functionName: fn, args, value: value ?? BigInt(0) });
      await wallet.client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED });
      setTx("✓ Complete"); await load(); setSelected(null);
    } catch (e: any) { setTx(`⚠ ${e.message}`); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1620", color: "#cbd5e1", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 22px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff" }}>
              Domain<span style={{ color: "#2dd4bf" }}>Appraiser</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5b7488", fontFamily: "monospace" }}>AI-consensus domain valuations</p>
          </div>
          {wallet.address ? (
            <div style={{ ...pill, color: "#2dd4bf", border: "1px solid #134e4a", background: "#0f2a2a" }}>● {shortAddr(wallet.address)}</div>
          ) : (
            <button onClick={handleConnect} style={btn}>Connect Wallet</button>
          )}
        </div>

        {tx && <div style={statusBar}>{tx}</div>}

        <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
          <button onClick={() => { setTab("browse"); setSelected(null); }} style={tabBtn(tab === "browse")}>Appraisals</button>
          <button onClick={() => { setTab("create"); setSelected(null); }} style={tabBtn(tab === "create")}>New Appraisal</button>
        </div>

        {tab === "create" && (
          <form onSubmit={e => { e.preventDefault(); send("request_appraisal", [form.domain], BigInt(form.fee || "0") * BigInt(10 ** 18)); }} style={card}>
            <label style={lbl}>DOMAIN</label>
            <input placeholder="example.com" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} required style={inp} />
            <label style={lbl}>FEE (GEN)</label>
            <input type="number" min="1" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} required style={inp} />
            <button type="submit" disabled={loading} style={{ ...btn, marginTop: 14, width: "100%" }}>Request Appraisal</button>
          </form>
        )}

        {tab === "browse" && !selected && (
          <div style={{ display: "grid", gap: 10 }}>
            {items.length === 0 && <p style={{ color: "#5b7488", fontFamily: "monospace" }}>// no appraisals yet</p>}
            {items.map(a => (
              <div key={a.id} onClick={() => setSelected(a)} style={{ ...card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 16, color: "#e2e8f0" }}>{a.domain}</span>
                {a.valuation ? (() => { const v = JSON.parse(a.valuation); return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: "monospace", color: "#94a3b8", fontSize: 13 }}>${v.estimated_value_usd?.toLocaleString()}</span>
                    <span style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", background: gradeColor(v.grade) + "22", color: gradeColor(v.grade), fontWeight: 800 }}>{v.grade}</span>
                  </div>
                ); })() : <span style={{ ...pill, color: "#d97706", border: "1px solid #78350f" }}>pending</span>}
              </div>
            ))}
          </div>
        )}

        {tab === "browse" && selected && (
          <div style={card}>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#2dd4bf", cursor: "pointer", fontFamily: "monospace" }}>← back</button>
            <h2 style={{ fontFamily: "monospace", color: "#fff", marginTop: 10 }}>{selected.domain}</h2>
            {selected.valuation ? (() => {
              const v = JSON.parse(selected.valuation);
              return (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, display: "grid", placeItems: "center", background: gradeColor(v.grade) + "22", color: gradeColor(v.grade), fontSize: 36, fontWeight: 800 }}>{v.grade}</div>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 22, color: "#fff" }}>${v.estimated_value_usd?.toLocaleString()} – ${v.estimated_value_high_usd?.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: "#5b7488" }}>estimated market value</div>
                    </div>
                  </div>
                  <p style={{ lineHeight: 1.6 }}>{v.summary}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div style={{ background: "#0f2a2a", padding: 12, borderRadius: 8, border: "1px solid #134e4a" }}>
                      <strong style={{ color: "#2dd4bf", fontSize: 13 }}>STRENGTHS</strong>
                      <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 13 }}>{(v.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    <div style={{ background: "#2a1410", padding: 12, borderRadius: 8, border: "1px solid #78350f" }}>
                      <strong style={{ color: "#fb923c", fontSize: 13 }}>WEAKNESSES</strong>
                      <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 13 }}>{(v.weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  </div>
                  {v.comparable_sales && <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}><b>Comparables:</b> {v.comparable_sales}</p>}
                </div>
              );
            })() : (
              <button onClick={() => send("appraise", [selected.id])} disabled={loading} style={{ ...btn, marginTop: 16 }}>Run AI Appraisal</button>
            )}
          </div>
        )}

        <footer style={{ marginTop: 50, textAlign: "center", color: "#3b5468", fontFamily: "monospace", fontSize: 11 }}>
          GenLayer AI consensus · {shortAddr(CONTRACT_ADDRESS)}
        </footer>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#0f1f2e", border: "1px solid #1e3a4a", borderRadius: 12, padding: 20 };
const inp: React.CSSProperties = { padding: 11, borderRadius: 8, border: "1px solid #1e3a4a", background: "#0b1620", color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box", marginBottom: 4, fontFamily: "monospace" };
const lbl: React.CSSProperties = { fontSize: 11, color: "#5b7488", fontWeight: 700, marginTop: 12, display: "block", fontFamily: "monospace", letterSpacing: 1 };
const btn: React.CSSProperties = { padding: "11px 22px", borderRadius: 8, border: "none", background: "#2dd4bf", color: "#06231f", fontSize: 14, cursor: "pointer", fontWeight: 700 };
const pill: React.CSSProperties = { padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "monospace" };
const statusBar: React.CSSProperties = { background: "#0f2a2a", border: "1px solid #134e4a", padding: 12, borderRadius: 8, fontSize: 13, color: "#2dd4bf", marginTop: 16, fontFamily: "monospace" };
const tabBtn = (a: boolean): React.CSSProperties => ({ padding: "9px 18px", background: a ? "#2dd4bf" : "transparent", border: "1px solid " + (a ? "#2dd4bf" : "#1e3a4a"), borderRadius: 8, color: a ? "#06231f" : "#5b7488", cursor: "pointer", fontWeight: 700 });
