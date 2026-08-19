"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../src/lib/api";

const STATUSES = ["Tous", "EN_ATTENTE", "APPROUVE", "REFUSE", "TERMINE"] as const;

const STATUS_BADGE: Record<string, string> = {
  EN_ATTENTE: "badge-warning",
  APPROUVE: "badge-success",
  REFUSE: "badge-danger",
  TERMINE: "badge-neutral",
};

const STATUS_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE: "Approuvé",
  REFUSE: "Refusé",
  TERMINE: "Terminé",
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Tous");
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (status !== "Tous") params.status = status;

    adminApi.withdrawals(params)
      .then((res) => {
        setWithdrawals(res.withdrawals ?? []);
        setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);
  useEffect(() => { setPage(1); }, [status]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await adminApi.processWithdrawal(id, { status: "APPROUVE" });
      fetchWithdrawals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (id: string) => {
    const note = window.prompt("Raison du refus :");
    if (note === null) return;
    setProcessingId(id);
    try {
      await adminApi.processWithdrawal(id, { status: "REFUSE", note: note || undefined });
      fetchWithdrawals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Retraits</h1>
          <p>Gestion des demandes de retrait</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`filter-chip ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s === "Tous" ? "Tous" : STATUS_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: "var(--danger)" }}>{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Marchand</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Aucune demande de retrait</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{w.id?.slice(0, 8)}</td>
                      <td>{w.user?.phone ?? w.merchantPhone ?? "-"}</td>
                      <td style={{ fontWeight: 700 }}>{(w.amount ?? 0).toLocaleString("fr-FR")} FC</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[w.status] ?? "badge-neutral"}`}>
                          {STATUS_LABEL[w.status] ?? w.status}
                        </span>
                      </td>
                      <td>{w.createdAt ? new Date(w.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                      <td>
                        {w.status === "EN_ATTENTE" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-success btn-sm"
                              disabled={processingId === w.id}
                              onClick={() => handleApprove(w.id)}
                            >
                              Approuver
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={processingId === w.id}
                              onClick={() => handleRefuse(w.id)}
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </button>
            <span>Page {pagination.page} / {pagination.pages || 1}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
