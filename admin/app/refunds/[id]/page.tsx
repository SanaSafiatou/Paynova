"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "../../../src/lib/api";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning",
  APPROVED: "badge-info",
  COMPLETED: "badge-success",
  REFUSED: "badge-danger",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  COMPLETED: "Terminé",
  REFUSED: "Refusé",
};

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [refund, setRefund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRefund = () => {
    setLoading(true);
    adminApi.refundDetail(id!)
      .then(setRefund)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) fetchRefund(); }, [id]);

  const handleApprove = async () => {
    if (!confirm("Approuver ce remboursement ?")) return;
    setActionLoading(true);
    try {
      await adminApi.approveRefund(id!);
      fetchRefund();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const handleRefuse = async () => {
    const note = prompt("Raison du refus :");
    if (note === null) return;
    setActionLoading(true);
    try {
      await adminApi.refuseRefund(id!, note || undefined);
      fetchRefund();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const handleExecute = async () => {
    if (!confirm(`Exécuter le remboursement de ${Number(refund.refundAmount).toLocaleString("fr-FR")} FC ?\n\nDébit: ${refund.debitUser?.phone}\nCrédit: ${refund.creditUser?.phone}`)) return;
    setActionLoading(true);
    try {
      await adminApi.executeRefund(id!);
      fetchRefund();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error) return <div style={{ padding: 32, color: "var(--danger)" }}>{error}</div>;
  if (!refund) return <div style={{ padding: 32 }}>Remboursement non trouvé</div>;

  const tx = refund.transaction;

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Remboursement
            <span className={`badge ${STATUS_BADGE[refund.status] ?? "badge-neutral"}`} style={{ fontSize: 14 }}>
              {STATUS_LABEL[refund.status]}
            </span>
          </h1>
          <p style={{ fontFamily: "monospace" }}>{refund.refundReference}</p>
        </div>
        <button className="btn btn-outline" onClick={() => router.back()}>← Retour</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Refund Info */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Remboursement</h3>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Montant</td><td style={{ fontWeight: 800, fontSize: 18 }}>{Number(refund.refundAmount).toLocaleString("fr-FR")} FC</td></tr>
              <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Raison</td><td>{refund.reason}</td></tr>
              {refund.note && <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Note</td><td>{refund.note}</td></tr>}
              <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Créé le</td><td>{new Date(refund.createdAt).toLocaleString("fr-FR")}</td></tr>
              {refund.executedAt && (
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Exécuté le</td><td>{new Date(refund.executedAt).toLocaleString("fr-FR")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Original Transaction */}
        {tx && (
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Transaction originale</h3>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Type</td><td>{tx.type}</td></tr>
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Montant</td><td>{Number(tx.amount).toLocaleString("fr-FR")} FC</td></tr>
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Frais</td><td>{Number(tx.fees).toLocaleString("fr-FR")} FC</td></tr>
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Statut</td><td>{tx.status}</td></tr>
                <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Référence</td><td style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.reference || "N/A"}</td></tr>
                {tx.client && <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Client</td><td>{tx.client.name || tx.client.phone}</td></tr>}
                {tx.agent && <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Agent</td><td>{tx.agent.name || tx.agent.phone}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accounts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 0, marginBottom: 16 }}>
        <div className="card" style={{ borderRight: "none", borderTopRightRadius: 0, borderBottomRightRadius: 0, background: "#FEF2F2" }}>
          <h3 style={{ color: "#EF4444", marginBottom: 8 }}>Compte à débiter</h3>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{refund.debitUser?.name || refund.debitUser?.phone || "—"}</p>
          <p style={{ fontSize: 12, color: "#888" }}>Solde: {Number(refund.debitUser?.balance || 0).toLocaleString("fr-FR")} FC</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>→</div>
        <div className="card" style={{ borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, background: "#F0FDF4" }}>
          <h3 style={{ color: "#10B981", marginBottom: 8 }}>Compte à créditer</h3>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{refund.creditUser?.name || refund.creditUser?.phone || "—"}</p>
          <p style={{ fontSize: 12, color: "#888" }}>Solde: {Number(refund.creditUser?.balance || 0).toLocaleString("fr-FR")} FC</p>
        </div>
      </div>

      {/* Fees & Admin */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Frais</h3>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#888" }}>Frais originaux</div>
              <div style={{ fontWeight: 800 }}>{Number(refund.originalFees).toLocaleString("fr-FR")} FC</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#888" }}>Montant remboursé</div>
              <div style={{ fontWeight: 800, color: "var(--primary)" }}>{Number(refund.refundAmount).toLocaleString("fr-FR")} FC</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Traçabilité</h3>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Admin</td><td>{refund.admin?.name || refund.admin?.phone || "—"}</td></tr>
              <tr><td style={{ fontWeight: 600, color: "#888", padding: "4px 8px" }}>Réf. originale</td><td style={{ fontFamily: "monospace", fontSize: 12 }}>{refund.originalReference || "N/A"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      {(refund.status === "PENDING" || refund.status === "APPROVED") && (
        <div className="card" style={{ display: "flex", gap: 16, padding: 20 }}>
          {refund.status === "PENDING" && (
            <>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleRefuse}>
                ✕ Refuser
              </button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={handleApprove}>
                ✓ Approuver
              </button>
            </>
          )}
          {refund.status === "APPROVED" && (
            <>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleRefuse}>
                ✕ Annuler
              </button>
              <button className="btn btn-success" disabled={actionLoading} onClick={handleExecute}>
                ▶ Exécuter le remboursement
              </button>
            </>
          )}
          {actionLoading && <span style={{ alignSelf: "center" }}>En cours...</span>}
        </div>
      )}
    </div>
  );
}
