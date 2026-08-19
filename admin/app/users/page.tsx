"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../src/lib/api";

const ROLES = ["Tous", "CLIENT", "AGENT", "COMMERCANT", "ADMIN", "SUPER_ADMIN"];
const STATUSES = ["Tous", "ACTIVE", "SUSPENDED", "PENDING_VALIDATION"];

const ROLE_BADGE: Record<string, string> = {
  CLIENT: "badge-neutral",
  AGENT: "badge-success",
  COMMERCANT: "badge-info",
  ADMIN: "badge-info",
  SUPER_ADMIN: "badge-warning",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-success",
  SUSPENDED: "badge-danger",
  PENDING_VALIDATION: "badge-warning",
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("Tous");
  const [status, setStatus] = useState("Tous");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (search.trim()) params.q = search.trim();
    if (role !== "Tous") params.role = role;
    if (status !== "Tous") params.status = status;

    adminApi.users(params)
      .then((res) => {
        setUsers(res.users ?? []);
        setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setPage(1); }, [search, role, status]);

  const handleSearch = (v: string) => {
    setSearch(v);
  };

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Utilisateurs</h1>
          <p>Gestion des comptes utilisateurs</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          <input
            className="form-input"
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Rôle</div>
        <div className="filter-bar">
          {ROLES.map((r) => (
            <button key={r} className={`filter-chip ${role === r ? "active" : ""}`}
              onClick={() => setRole(r)}>
              {r === "Tous" ? "Tous" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Statut</div>
        <div className="filter-bar">
          {STATUSES.map((s) => (
            <button key={s} className={`filter-chip ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}>
              {s === "Tous" ? "Tous" : s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : error ? (
        <div className="card" style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Aucun utilisateur trouvé</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name ?? "-"}</td>
                      <td>{u.phone ?? "-"}</td>
                      <td><span className={`badge ${ROLE_BADGE[u.role] ?? "badge-neutral"}`}>{u.role}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[u.status] ?? "badge-neutral"}`}>{u.status?.replace(/_/g, " ")}</span></td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                      <td>
                        <button className="btn btn-outline btn-sm"
                          onClick={() => { window.location.href = `/users/${u.id}`; }}>
                          Voir
                        </button>
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
