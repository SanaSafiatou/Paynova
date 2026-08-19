"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { adminApi } from "../../src/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.dashboard()
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error) return <div className="card" style={{ margin: 32, color: "var(--danger)" }}>{error}</div>;
  if (!data) return null;

  const d = data as any;

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Vue d&apos;ensemble de la plateforme PayNova</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--info-bg)", color: "var(--info)" }}>👥</div>
          <div className="stat-info">
            <h3>{(d.totalUsers ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Total Utilisateurs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>🤖</div>
          <div className="stat-info">
            <h3>{(d.totalAgents ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Total Agents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>🏪</div>
          <div className="stat-info">
            <h3>{(d.totalMerchants ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Total Commerçants</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>💳</div>
          <div className="stat-info">
            <h3>{(d.totalTransactions ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>📊</div>
          <div className="stat-info">
            <h3>{(d.todayOperations ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Opérations du jour</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--info-bg)", color: "var(--info)" }}>💵</div>
          <div className="stat-info">
            <h3>{(d.todayAmount ?? 0).toLocaleString("fr-FR")} FC</h3>
            <p>Montant du jour</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>📥</div>
          <div className="stat-info">
            <h3>{(d.todayDeposits ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Dépôts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>📤</div>
          <div className="stat-info">
            <h3>{(d.todayWithdrawals ?? 0).toLocaleString("fr-FR")}</h3>
            <p>Retraits</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Transactions récentes</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Expéditeur</th>
                <th>Bénéficiaire</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(d.recentTransactions ?? []).length === 0 ? (
                <tr><td colSpan={7} className="empty">Aucune transaction récente</td></tr>
              ) : (
                (d.recentTransactions ?? []).map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.id?.slice(0, 8)}</td>
                    <td>{tx.senderName ?? tx.senderPhone ?? "-"}</td>
                    <td>{tx.receiverName ?? tx.receiverPhone ?? "-"}</td>
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
