"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../src/lib/api";

const ACTIONS = [
  "Tous",
  "LOGIN",
  "LOGOUT",
  "REGISTER",
  "CREATE_ADMIN",
  "UPDATE_SETTINGS",
  "VALIDATE_AGENT",
  "SUSPEND_USER",
  "WITHDRAWAL_APPROVE",
  "WITHDRAWAL_REFUSE",
  "PAYMENT",
] as const;

const ACTION_BADGE: Record<string, string> = {
  LOGIN: "badge-success",
  LOGOUT: "badge-neutral",
  REGISTER: "badge-info",
  CREATE_ADMIN: "badge-warning",
  UPDATE_SETTINGS: "badge-info",
  VALIDATE_AGENT: "badge-success",
  SUSPEND_USER: "badge-danger",
  WITHDRAWAL_APPROVE: "badge-success",
  WITHDRAWAL_REFUSE: "badge-danger",
  PAYMENT: "badge-info",
};

const ACTION_LABEL: Record<string, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  REGISTER: "Inscription",
  CREATE_ADMIN: "Création admin",
  UPDATE_SETTINGS: "Modif. paramètres",
  VALIDATE_AGENT: "Validation agent",
  SUSPEND_USER: "Suspension",
  WITHDRAWAL_APPROVE: "Retrait approuvé",
  WITHDRAWAL_REFUSE: "Retrait refusé",
  PAYMENT: "Paiement",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("Tous");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (action !== "Tous") params.action = action;
    if (from) params.from = from;
    if (to) params.to = to;

    adminApi.audit(params)
      .then((res) => {
        setLogs(res.logs ?? []);
        setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, action, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [action, from, to]);

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Audit Log</h1>
          <p>Historique des actions administratives</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          {ACTIONS.map((a) => (
            <button
              key={a}
              className={`filter-chip ${action === a ? "active" : ""}`}
              onClick={() => setAction(a)}
            >
              {a === "Tous" ? "Tous" : ACTION_LABEL[a] ?? a}
            </button>
          ))}
        </div>

        <div className="form-row" style={{ alignItems: "flex-end", marginTop: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Date début</label>
            <input
              className="form-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Date fin</label>
            <input
              className="form-input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={fetchLogs}>
            Rechercher
          </button>
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
                  <th>Action</th>
                  <th>Acteur</th>
                  <th>Cible</th>
                  <th>Détails</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="empty">Aucune entrée d&apos;audit</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${ACTION_BADGE[log.action] ?? "badge-neutral"}`}>
                          {ACTION_LABEL[log.action] ?? log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{log.actorId?.slice(0, 8) ?? "-"}</td>
                      <td>{log.targetType && log.targetId ? `${log.targetType} · ${log.targetId.slice(0, 8)}` : "-"}</td>
                      <td style={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.details ? (typeof log.details === "string" ? log.details : JSON.stringify(log.details)) : "-"}
                      </td>
                      <td>{log.createdAt ? new Date(log.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
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
