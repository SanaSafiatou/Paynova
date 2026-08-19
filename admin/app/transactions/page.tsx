"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi } from "../../src/lib/api";

const TYPEFilters = ["Tous", "DEPOSIT", "WITHDRAWAL", "TRANSFER", "PAYMENT"];
const STATUSFilters = ["Tous", "SUCCESS", "PENDING", "FAILED"];

const typeBadge = (t: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    DEPOSIT: { cls: "badge-success", label: "Dépôt" },
    WITHDRAWAL: { cls: "badge-warning", label: "Retrait" },
    TRANSFER: { cls: "badge-info", label: "Transfert" },
    PAYMENT: { cls: "badge-neutral", label: "Paiement" },
  };
  const m = map[t] || { cls: "badge-neutral", label: t };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
};

const statusBadge = (s: string) => {
  if (s === "SUCCESS") return <span className="badge badge-success">Succès</span>;
  if (s === "PENDING") return <span className="badge badge-warning">En cours</span>;
  if (s === "FAILED") return <span className="badge badge-danger">Échoué</span>;
  return <span className="badge badge-neutral">{s}</span>;
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "Tous");
  const [status, setStatus] = useState(searchParams.get("status") || "Tous");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (q) params.q = q;
      if (type !== "Tous") params.type = type;
      if (status !== "Tous") params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await adminApi.transactions(params);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTx(); }, [page, status, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTx();
  };

  const shortId = (id: string) => (id ? id.slice(0, 8) : "—");

  return (
    <div>
      <div className="page-header">
        <div><h1>Transactions</h1><p>Historique des transactions PayNova</p></div>
      </div>
      <div style={{ padding: 24 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSearch}>
            <div className="filter-bar">
              <input className="form-input" placeholder="Rechercher..." value={q}
                onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 240 }} />
              <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                style={{ maxWidth: 180 }} placeholder="Du (AAAA-MM-JJ)" />
              <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)}
                style={{ maxWidth: 180 }} placeholder="Au (AAAA-MM-JJ)" />
              <button className="btn btn-primary btn-sm" type="submit">Rechercher</button>
            </div>
          </form>
          <div className="filter-bar">
            {TYPEFilters.map((t) => (
              <button key={t} className={`filter-chip ${type === t ? "active" : ""}`}
                onClick={() => { setType(t); setPage(1); }}>
                {t === "Tous" ? "Tous" : t === "DEPOSIT" ? "Dépôt" : t === "WITHDRAWAL" ? "Retrait" : t === "TRANSFER" ? "Transfert" : "Paiement"}
              </button>
            ))}
          </div>
          <div className="filter-bar">
            {STATUSFilters.map((s) => (
              <button key={s} className={`filter-chip ${status === s ? "active" : ""}`}
                onClick={() => { setStatus(s); setPage(1); }}>
                {s === "Tous" ? "Tous" : s === "SUCCESS" ? "Succès" : s === "PENDING" ? "En cours" : "Échoué"}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty">Aucune transaction trouvée</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Frais</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{shortId(t.id)}</td>
                        <td>{typeBadge(t.type)}</td>
                        <td style={{ fontWeight: 600 }}>{(t.amount ?? 0).toLocaleString("fr-FR")} FCFA</td>
                        <td>{(t.fee ?? t.fees ?? 0).toLocaleString("fr-FR")} FCFA</td>
                        <td>{statusBadge(t.status)}</td>
                        <td>{new Date(t.createdAt || t.date).toLocaleDateString("fr-FR")}</td>
                        <td>
                          <button className="btn btn-outline btn-sm"
                            onClick={() => { window.location.href = `/transactions/${t.id}`; }}>
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
                  <span>Page {pagination.page} / {pagination.totalPages}</span>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
