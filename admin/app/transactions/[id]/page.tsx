"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "../../../src/lib/api";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.transactionDetail(id);
      setTx(data);
    } catch {
      setTx(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleFlag = async () => {
    const reason = window.prompt("Raison du signalement :");
    if (!reason) return;
    setFlagging(true);
    try {
      await adminApi.flagTransaction(id, reason);
      await load();
    } finally {
      setFlagging(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!tx) return <div className="empty">Transaction introuvable</div>;

  const statusColor = (s: string) => {
    if (s === "SUCCESS") return "var(--success)";
    if (s === "PENDING") return "var(--warning)";
    return "var(--danger)";
  };

  const statusBadge = (s: string) => {
    if (s === "SUCCESS") return <span className="badge badge-success">Succès</span>;
    if (s === "PENDING") return <span className="badge badge-warning">En cours</span>;
    if (s === "FAILED") return <span className="badge badge-danger">Échoué</span>;
    return <span className="badge badge-neutral">{s}</span>;
  };

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { DEPOSIT: "Dépôt", WITHDRAWAL: "Retrait", TRANSFER: "Transfert", PAYMENT: "Paiement" };
    return map[t] || t;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/transactions" style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "inline-block" }}>
            &larr; Retour aux transactions
          </Link>
          <h1>Transaction</h1>
          <p style={{ fontFamily: "monospace", fontSize: 13 }}>{tx.id}</p>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="content-grid">
          <div>
            <div className="card" style={{ marginBottom: 16, textAlign: "center", padding: 32 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "12px 28px", borderRadius: 12,
                background: `${statusColor(tx.status)}15`, border: `2px solid ${statusColor(tx.status)}`,
              }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: statusColor(tx.status) }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: statusColor(tx.status) }}>
                  {tx.status === "SUCCESS" ? "Succès" : tx.status === "PENDING" ? "En cours" : "Échoué"}
                </span>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Détails</h2></div>
              <div className="detail-grid">
                <div className="detail-row"><span className="label">Type</span><span className="value">{typeLabel(tx.type)}</span></div>
                <div className="detail-row"><span className="label">Référence</span><span className="value" style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.reference || "—"}</span></div>
                <div className="detail-row"><span className="label">Montant</span><span className="value">{(tx.amount ?? 0).toLocaleString("fr-FR")} FCFA</span></div>
                <div className="detail-row"><span className="label">Frais</span><span className="value">{(tx.fee ?? tx.fees ?? 0).toLocaleString("fr-FR")} FCFA</span></div>
                <div className="detail-row"><span className="label">Commission</span><span className="value">{(tx.commission ?? 0).toLocaleString("fr-FR")} FCFA</span></div>
                <div className="detail-row"><span className="label">Montant net</span><span className="value" style={{ fontWeight: 800 }}>{((tx.amount ?? 0) - (tx.fee ?? tx.fees ?? 0)).toLocaleString("fr-FR")} FCFA</span></div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Informations</h2></div>
              <div className="detail-grid">
                <div className="detail-row"><span className="label">Client</span><span className="value">{tx.clientName || tx.clientPhone || tx.user?.phone || "—"}</span></div>
                <div className="detail-row"><span className="label">Agent</span><span className="value">{tx.agentName || tx.agent?.name || "—"}</span></div>
                <div className="detail-row"><span className="label">Date</span><span className="value">{tx.createdAt ? new Date(tx.createdAt).toLocaleString("fr-FR") : "—"}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Signalement</h2></div>
              {tx.flagged || tx.flagReason ? (
                <div>
                  <div className="detail-row">
                    <span className="label">Raison</span>
                    <span className="value" style={{ color: "var(--danger)" }}>{tx.flagReason || "Signalement sans raison"}</span>
                  </div>
                  {tx.flagDescription && (
                    <div className="detail-row">
                      <span className="label">Description</span>
                      <span className="value">{tx.flagDescription}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Aucun signalement</p>
                  <button className="btn btn-danger btn-sm" disabled={flagging} onClick={handleFlag}>
                    {flagging ? "Signalement..." : "Signaler"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
