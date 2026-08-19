"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi } from "../../src/lib/api";

const STATUSFilters = ["Tous", "ACTIVE", "SUSPENDED", "PENDING_VALIDATION"];

const statusBadge = (s: string) => {
  if (s === "ACTIVE") return <span className="badge badge-success">Actif</span>;
  if (s === "SUSPENDED") return <span className="badge badge-danger">Suspendu</span>;
  if (s === "PENDING_VALIDATION") return <span className="badge badge-warning">En attente</span>;
  return <span className="badge badge-neutral">{s}</span>;
};

const validatedBadge = (v: boolean) =>
  v ? <span className="badge badge-success">Oui</span> : <span className="badge badge-neutral">Non</span>;

export default function MerchantsPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
      <MerchantsPageContent />
    </Suspense>
  );
}

function MerchantsPageContent() {
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "Tous");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (q) params.q = q;
      if (status !== "Tous") params.status = status;
      const data = await adminApi.merchants(params);
      setMerchants(data.merchants || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMerchants();
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Commerçants</h1><p>Gestion des marchands PayNova</p></div>
      </div>
      <div style={{ padding: 24 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="filter-bar">
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1 }}>
              <input className="form-input" placeholder="Rechercher un marchand..." value={q}
                onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
              <button className="btn btn-primary btn-sm" type="submit">Rechercher</button>
            </form>
          </div>
          <div className="filter-bar">
            {STATUSFilters.map((s) => (
              <button key={s} className={`filter-chip ${status === s ? "active" : ""}`}
                onClick={() => { setStatus(s); setPage(1); }}>
                {s === "Tous" ? "Tous" : s === "ACTIVE" ? "Actif" : s === "SUSPENDED" ? "Suspendu" : "En attente"}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : merchants.length === 0 ? (
            <div className="empty">Aucun marchand trouvé</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nom commercial</th>
                      <th>Téléphone</th>
                      <th>Code marchand</th>
                      <th>Statut</th>
                      <th>Validé</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.businessName || m.name || "—"}</td>
                        <td>{m.phone}</td>
                        <td><span className="badge badge-info">{m.merchantCode || "—"}</span></td>
                        <td>{statusBadge(m.status)}</td>
                        <td>{validatedBadge(m.validated)}</td>
                        <td>
                          <button className="btn btn-outline btn-sm"
                            onClick={() => { window.location.href = `/merchants/${m.id}`; }}>
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
