"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../src/lib/api";
import Link from "next/link";

const STATUSES = ["Tous", "PENDING", "APPROVED", "COMPLETED", "REFUSED"] as const;

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

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Tous");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchRefunds = useCallback(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (status !== "Tous") params.status = status;
    if (search) params.q = search;

    Promise.all([
      adminApi.refunds(params),
      page === 1 ? adminApi.refundStats() : Promise.resolve(null),
    ])
      .then(([res, statsRes]) => {
        setRefunds(res.refunds ?? []);
        setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
        if (statsRes) setStats(statsRes);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);
  useEffect(() => { setPage(1); }, [status, search]);

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Remboursements</h1>
          <p>Gestion des demandes de remboursement administratif</p>
        </div>
        <Link href="/refunds/new" className="btn btn-primary">
          + Nouveau remboursement
        </Link>
      </div>

      {stats && (
        <div className="stats-grid" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div className="stat-card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#D97706" }}>{stats.pending}</div>
            <div style={{ fontSize: 12, color: "#888" }}>En attente</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2563EB" }}>{stats.approved}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Approuvé</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>{stats.completed}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Terminé</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
              {stats.totalRefunded?.toLocaleString("fr-FR")} <span style={{ fontSize: 14 }}>FC</span>
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Total remboursé</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar" style={{ flexWrap: "wrap", gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher une référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 250 }}
          />
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
                  <th>Référence</th>
                  <th>Transaction</th>
                  <th>Montant</th>
                  <th>Débit → Crédit</th>
                  <th>Statut</th>
                  <th>Admin</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr><td colSpan={8} className="empty">Aucun remboursement</td></tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>
                        {r.refundReference}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                        {r.originalReference ?? r.transaction?.reference?.slice(0, 16) ?? "-"}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {Number(r.refundAmount).toLocaleString("fr-FR")} FC
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {r.debitUser?.phone ?? "-"} → {r.creditUser?.phone ?? "-"}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-neutral"}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td>{r.admin?.phone ?? "-"}</td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                      <td>
                        <Link href={`/refunds/${r.id}`} className="btn btn-sm btn-outline">
                          Détail
                        </Link>
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
