"use client";
import { useState, useEffect, useCallback } from "react";
import { CONTRACT_ADDRESS, connectWallet, readClient, shortAddr, type WalletState } from "@/lib/genlayer";
import { TransactionStatus } from "genlayer-js/types";

type Appraisal = { id: string; requester: string; domain: string; fee: string; status: number; valuation: string; };
const gradeColor = (g: string) => ({ A: "#10b981", B: "#14b8a6", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] || "#64748b");

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>({ address: null, client: null });
  const [items, setItems] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Appraisal | null>(null);
  const [form, setForm] = useState({ domain: "", fee: "1" });
  const [tx, setTx] = useState("");

  const load = useCallback(async () => {
    try {
      const rc = readClient();
      const count = Number(await rc.readContract({ address: CONTRACT_ADDRESS, functionName: "get_appraisal_count", args: [] }));
      const out: Appraisal[] = [];
      for (let i = 1; i <= count; i++) { const raw = await rc.readContract({ address: CONTRACT_ADDRESS, functionName: "get_appraisal", args: [String(i)] }); out.push(JSON.parse(raw as string)); }
      setItems(out.reverse());
    } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleConnect() { setTx("Connecting…"); try { const w = await connectWallet(); setWallet(w); setTx(""); } catch (e: any) { setTx(e.message); } }
  async function send(fn: string, args: any[], value?: bigint) {
    if (!wallet.client) { setTx("Connect wallet first"); return; }
    setLoading(true); setTx(`${fn}…`);
    try {
      const hash = await wallet.client.writeContract({ address: CONTRACT_ADDRESS, functionName: fn, args, value: value ?? BigInt(0) });
      const _rcpt: any = await wallet.client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 30, interval: 5000 });
      const _st = String((_rcpt && (_rcpt.statusName ?? _rcpt.status)) || "").toUpperCase();
      if (_st && _st !== "ACCEPTED" && _st !== "FINALIZED") throw new Error(/UNDETERMINED|TIMEOUT|NO_MAJORITY|DISAGREE/.test(_st) ? "AI validators could not reach consensus — no funds were moved. Please try again." : ("Transaction did not complete (" + _st + ")."));
      setTx(""); await load(); setSelected(null);
    } catch (e: any) { setTx(e.message); }
    setLoading(false);
  }

  const valued = items.filter(i => i.valuation).map(i => JSON.parse(i.valuation));
  const totalVal = valued.reduce((s, v) => s + (v.estimated_value_usd || 0), 0);
  const avgGradeNum = valued.length ? valued.reduce((s, v) => s + ({ A: 4, B: 3, C: 2, D: 1, F: 0 } as any)[v.grade], 0) / valued.length : 0;
  const avgGrade = ["F", "D", "C", "B", "A"][Math.round(avgGradeNum)] || "—";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e14", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: "1px solid #1a2230" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#10b981,#14b8a6)", display: "grid", placeItems: "center", fontWeight: 800, color: "#06231f" }}>D</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>DomainAppraiser <span style={{ color: "#475569", fontWeight: 400, fontSize: 13 }}>/ analytics</span></span>
        </div>
        {wallet.address ? (
          <span style={{ fontFamily: "monospace", fontSize: 12, background: "#0f1b16", border: "1px solid #134e4a", color: "#2dd4bf", padding: "6px 12px", borderRadius: 6 }}>● {shortAddr(wallet.address)}</span>
        ) : (
          <button onClick={handleConnect} style={{ fontFamily: "monospace", fontSize: 12, background: "#10b981", border: "none", color: "#06231f", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>◴ connect_wallet()</button>
        )}
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 24px 80px" }}>
        {tx && <div style={{ background: "#0f1b16", border: "1px solid #134e4a", color: "#2dd4bf", padding: 10, borderRadius: 8, marginBottom: 16, fontFamily: "monospace", fontSize: 13 }}>{tx}</div>}

        {/* stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[["TOTAL APPRAISALS", items.length], ["VALUED", valued.length], ["AVG GRADE", avgGrade], ["PORTFOLIO EST.", "$" + totalVal.toLocaleString()]].map(([label, val], i) => (
            <div key={i} style={tile}>
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", marginTop: 6, color: i === 2 ? gradeColor(avgGrade) : "#fff" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* About + how it works */}
        <div style={{ ...tile, marginBottom: 20, borderLeft: "3px solid #2dd4bf" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2dd4bf" }}>What DomainAppraiser does</div>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "6px 0 12px" }}>Get an AI-consensus valuation for any domain name. Multiple AI validators independently fetch the site and weigh length, keywords, extension, usage, and comparable sales — then must agree on a grade (A–F) and price range before it's written on-chain. No single appraiser's bias.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {[["1", "Connect wallet (top right)"], ["2", "Enter a domain + appraisal fee"], ["3", "Run the AI appraisal"], ["4", "Read the grade, value range & rationale"]].map(([n, t]) => (
              <div key={n} style={{ background: "#0a0e14", border: "1px solid #1a2230", borderRadius: 8, padding: "10px 12px" }}>
                <span style={{ color: "#2dd4bf", fontFamily: "monospace", fontSize: 12 }}>0{n}</span>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 3 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* left: new appraisal form */}
          <div style={{ ...tile, alignSelf: "start" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#2dd4bf" }}>+ New Appraisal</div>
            <form onSubmit={e => { e.preventDefault(); send("request_appraisal", [form.domain], BigInt(form.fee || "0") * BigInt(10 ** 18)); }}>
              <input placeholder="example.com" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} required style={inp} />
              <input placeholder="fee (GEN)" type="number" min="1" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} required style={inp} />
              <button disabled={loading} style={{ ...btn, width: "100%" }}>Request Appraisal</button>
            </form>
          </div>

          {/* right: data grid / detail */}
          <div>
            {!selected ? (
              <div style={{ ...tile, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 70px", padding: "12px 16px", borderBottom: "1px solid #1a2230", fontSize: 11, color: "#475569", letterSpacing: 1 }}>
                  <span>DOMAIN</span><span style={{ textAlign: "right" }}>EST. VALUE</span><span style={{ textAlign: "center" }}>GRADE</span>
                </div>
                {items.length === 0 && <div style={{ padding: 20, color: "#475569", fontFamily: "monospace", fontSize: 13 }}>// no rows</div>}
                {items.map(a => {
                  const v = a.valuation ? JSON.parse(a.valuation) : null;
                  return (
                    <div key={a.id} onClick={() => setSelected(a)} style={{ display: "grid", gridTemplateColumns: "1fr 110px 70px", padding: "14px 16px", borderBottom: "1px solid #131a24", cursor: "pointer", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{a.domain}</span>
                      <span style={{ textAlign: "right", fontFamily: "monospace", color: "#94a3b8" }}>{v ? "$" + v.estimated_value_usd?.toLocaleString() : "—"}</span>
                      <span style={{ textAlign: "center" }}>{v ? <span style={{ display: "inline-block", width: 26, height: 26, borderRadius: 6, background: gradeColor(v.grade) + "22", color: gradeColor(v.grade), lineHeight: "26px", fontWeight: 800, fontSize: 13 }}>{v.grade}</span> : <span style={{ color: "#f59e0b", fontSize: 11 }}>●</span>}</span>
                    </div>
                  );
                })}
              </div>
            ) : (() => {
              const v = selected.valuation ? JSON.parse(selected.valuation) : null;
              return (
                <div style={tile}>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#2dd4bf", cursor: "pointer", fontFamily: "monospace", marginBottom: 12 }}>← all rows</button>
                  <h2 style={{ fontFamily: "monospace", margin: "0 0 16px" }}>{selected.domain}</h2>
                  {v ? (
                    <>
                      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 14, display: "grid", placeItems: "center", background: gradeColor(v.grade) + "22", color: gradeColor(v.grade), fontSize: 38, fontWeight: 800 }}>{v.grade}</div>
                        <div>
                          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700 }}>${v.estimated_value_usd?.toLocaleString()} – ${v.estimated_value_high_usd?.toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: "#475569" }}>estimated market value (USD)</div>
                        </div>
                      </div>
                      <p style={{ lineHeight: 1.6, color: "#cbd5e1" }}>{v.summary}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <div style={{ background: "#0f1b16", border: "1px solid #134e4a", borderRadius: 8, padding: 12 }}><b style={{ color: "#2dd4bf", fontSize: 12 }}>STRENGTHS</b><ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 13 }}>{(v.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                        <div style={{ background: "#1a1410", border: "1px solid #78350f", borderRadius: 8, padding: 12 }}><b style={{ color: "#fb923c", fontSize: 12 }}>WEAKNESSES</b><ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 13 }}>{(v.weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></div>
                      </div>
                      {v.comparable_sales && <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}><b>Comparables:</b> {v.comparable_sales}</p>}
                    </>
                  ) : <button onClick={() => send("appraise", [selected.id])} disabled={loading} style={btn}>▶ Run AI Appraisal</button>}
                </div>
              );
            })()}
          </div>
        </div>

        <footer style={{ marginTop: 40, color: "#334155", fontFamily: "monospace", fontSize: 11, textAlign: "center" }}>genlayer ai consensus · {shortAddr(CONTRACT_ADDRESS)}</footer>
      </div>
      <style>{`body{margin:0}`}</style>
    </div>
  );
}

const tile: React.CSSProperties = { background: "#0f1620", border: "1px solid #1a2230", borderRadius: 12, padding: 18 };
const inp: React.CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #1a2230", background: "#0a0e14", color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box", marginBottom: 10, fontFamily: "monospace" };
const btn: React.CSSProperties = { padding: "10px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#06231f", fontSize: 14, cursor: "pointer", fontWeight: 700 };
