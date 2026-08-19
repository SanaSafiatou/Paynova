"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "../../../src/lib/api";

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        adminApi.merchantDetail(id),
        adminApi.merchantPayments(id, { limit: "20" }),
      ]);
      setMerchant(m);
      setPayments(p.payments || p || []);
    } catch {
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: () => Promise<any>) => {
    setSaving(true);
    try {
      await action();
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!merchant) return <div className="empty">Marchand introuvable</div>;

  const statusBadge = (s: string) => {
    if (s === "ACTIVE") return <span className="badge badge-success">Actif</span>;
    if (s === "SUSPENDED") return <span className="badge badge-danger">Suspendu</span>;
    if (s === "PENDING_VALIDATION") return <span className="badge badge-warning">En attente</span>;
    return <span className="badge badge-neutral">{s}</span>;
  };

  const paymentStatusBadge = (s: string) => {
    if (s === "SUCCESS") return <span className="badge badge-success">Succès</span>;
    if (s === "PENDING") return <span className="badge badge-warning">En cours</span>;
    if (s === "FAILED") return <span className="badge badge-danger">Échoué</span>;
    return <span className="badge badge-neutral">{s}</span>;
  };

  const totalCount = payments.length;
  const totalVolume = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const avgAmount = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/merchants" style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "inline-block" }}>
            &larr; Retour aux marchands
          </Link>
          <h1>{merchant.businessName || merchant.name || "Marchand"}</h1>
          <p>{merchant.phone}</p>
        </div>
        <div className="btn-group">
          {!merchant.validated && (
            <button className="btn btn-success btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.validateMerchant(id))}>
              Valider
            </button>
          )}
          {merchant.status === "ACTIVE" && (
            <button className="btn btn-danger btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.suspendMerchant(id))}>
              Suspendre
            </button>
          )}
          {merchant.status === "SUSPENDED" && (
            <button className="btn btn-success btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.reactivateMerchant(id))}>
              Réactiver
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="content-grid">
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Profil</h2></div>
              <div className="detail-grid">
                <div className="detail-row"><span className="label">Nom commercial</span><span className="value">{merchant.businessName || merchant.name || "—"}</span></div>
                <div className="detail-row"><span className="label">Type</span><span className="value">{merchant.businessType || merchant.type || "—"}</span></div>
                <div className="detail-row"><span className="label">Code marchand</span><span className="value">{merchant.merchantCode || "—"}</span></div>
                <div className="detail-row"><span className="label">Téléphone</span><span className="value">{merchant.phone}</span></div>
                <div className="detail-row"><span className="label">Solde</span><span className="value">{(merchant.balance ?? 0).toLocaleString("fr-FR")} FCFA</span></div>
                <div className="detail-row">
                  <span className="label">Validé</span>
                  <span className="value">
                    {merchant.validated ? <span className="badge badge-success">Oui</span> : <span className="badge badge-neutral">Non</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Statut</span>
                  <span className="value">{statusBadge(merchant.status)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Statistiques</h2></div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{totalCount}</h3>
                    <p>Paiements</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{totalVolume.toLocaleString("fr-FR")}</h3>
                    <p>Volume total (FCFA)</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{avgAmount.toLocaleString("fr-FR")}</h3>
                    <p>Moyenne (FCFA)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Derniers paiements</h2></div>
          {payments.length === 0 ? (
            <div className="empty">Aucun paiement</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Montant</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{(p.amount ?? 0).toLocaleString("fr-FR")} FCFA</td>
                      <td>{p.clientName || p.clientPhone || "—"}</td>
                      <td>{new Date(p.createdAt || p.date).toLocaleDateString("fr-FR")}</td>
                      <td>{paymentStatusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
