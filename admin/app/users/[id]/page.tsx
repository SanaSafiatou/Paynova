"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "../../../src/lib/api";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      adminApi.userDetail(id),
      adminApi.userTransactions(id, { limit: "10" }),
    ])
      .then(([u, txRes]) => {
        setUser(u);
        setTransactions(txRes.transactions ?? []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSuspend = async () => {
    if (!confirm("Suspendre cet utilisateur ?")) return;
    setActionLoading(true);
    try {
      await adminApi.suspendUser(id);
      setUser((prev: any) => ({ ...prev, status: "SUSPENDED" }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm("Réactiver cet utilisateur ?")) return;
    setActionLoading(true);
    try {
      await adminApi.reactivateUser(id);
      setUser((prev: any) => ({ ...prev, status: "ACTIVE" }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error && !user) return <div style={{ padding: 32, color: "var(--danger)" }} className="card">{error}</div>;
  if (!user) return null;

  const u = user as any;

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <Link href="/users" style={{ fontSize: 13, color: "var(--text-secondary)" }}>&larr; Retour aux utilisateurs</Link>
          <h1 style={{ marginTop: 4 }}>{u.name ?? "Utilisateur"}</h1>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, color: "var(--danger)", borderColor: "var(--danger)" }}>{error}</div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2>Informations</h2>
          <div className="btn-group">
            {u.status === "ACTIVE" && (
              <button className="btn btn-danger btn-sm" onClick={handleSuspend} disabled={actionLoading}>
                Suspendre
              </button>
            )}
            {u.status === "SUSPENDED" && (
              <button className="btn btn-success btn-sm" onClick={handleReactivate} disabled={actionLoading}>
                Réactiver
              </button>
            )}
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <div className="detail-row"><span className="label">Nom</span><span className="value">{u.name ?? "-"}</span></div>
            <div className="detail-row"><span className="label">Téléphone</span><span className="value">{u.phone ?? "-"}</span></div>
            <div className="detail-row"><span className="label">Rôle</span><span className="value">{u.role}</span></div>
            <div className="detail-row">
              <span className="label">Statut</span>
              <span className="value">
                <span className={`badge ${
                  u.status === "ACTIVE" ? "badge-success" :
                  u.status === "SUSPENDED" ? "badge-danger" :
                  u.status === "PENDING_VALIDATION" ? "badge-warning" : "badge-neutral"
                }`}>{u.status?.replace(/_/g, " ")}</span>
              </span>
            </div>
          </div>
          <div>
            <div className="detail-row">
              <span className="label">Solde</span>
              <span className="value">{(u.balance ?? 0).toLocaleString("fr-FR")} FC</span>
            </div>
            <div className="detail-row">
              <span className="label">Téléphone vérifié</span>
              <span className="value">
                <span className={`badge ${u.phoneVerified ? "badge-success" : "badge-neutral"}`}>
                  {u.phoneVerified ? "Oui" : "Non"}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Profil complet</span>
              <span className="value">
                <span className={`badge ${u.profileComplete ? "badge-success" : "badge-neutral"}`}>
                  {u.profileComplete ? "Oui" : "Non"}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Créé le</span>
              <span className="value">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {u.devices && u.devices.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h2>Appareils</h2></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dernière connexion</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {u.devices.map((d: any, i: number) => (
                  <tr key={d.id ?? i}>
                    <td>{d.type ?? d.platform ?? "-"}</td>
                    <td>{d.lastSeen ? new Date(d.lastSeen).toLocaleString("fr-FR") : "-"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{d.ip ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Historique des transactions</h2></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="empty">Aucune transaction</td></tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.id?.slice(0, 8)}</td>
                    <td style={{ fontWeight: 700 }}>{(tx.amount ?? 0).toLocaleString("fr-FR")} FC</td>
                    <td><span className="badge badge-info">{tx.type ?? "-"}</span></td>
                    <td>
                      <span className={`badge ${
                        tx.status === "COMPLETED" ? "badge-success" :
                        tx.status === "FAILED" ? "badge-danger" :
                        tx.status === "PENDING" ? "badge-warning" : "badge-neutral"
                      }`}>{tx.status ?? "-"}</span>
                    </td>
                    <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
