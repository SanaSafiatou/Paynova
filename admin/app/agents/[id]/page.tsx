"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "../../../src/lib/api";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [commissions, setCommissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([adminApi.agentDetail(id), adminApi.agentCommissions(id)]);
      setAgent(a);
      setCommissions(c);
      setTraining(a.trainingComplete || false);
      setNotes(a.notes || "");
    } catch {
      setAgent(null);
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

  const toggleTraining = async () => {
    const next = !training;
    setTraining(next);
    await handleAction(() => adminApi.updateAgentProfile(id, { trainingComplete: next }));
  };

  const saveNotes = async () => {
    await handleAction(() => adminApi.updateAgentProfile(id, { notes }));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!agent) return <div className="empty">Agent introuvable</div>;

  const statusBadge = (s: string) => {
    if (s === "ACTIVE") return <span className="badge badge-success">Actif</span>;
    if (s === "SUSPENDED") return <span className="badge badge-danger">Suspendu</span>;
    if (s === "PENDING_VALIDATION") return <span className="badge badge-warning">En attente</span>;
    return <span className="badge badge-neutral">{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/agents" style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "inline-block" }}>
            &larr; Retour aux agents
          </Link>
          <h1>{agent.name || "Agent"}</h1>
          <p>{agent.phone}</p>
        </div>
        <div className="btn-group">
          {!agent.validated && (
            <button className="btn btn-success btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.validateAgent(id))}>
              Valider
            </button>
          )}
          {agent.status === "ACTIVE" && (
            <button className="btn btn-danger btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.suspendAgent(id))}>
              Suspendre
            </button>
          )}
          {agent.status === "SUSPENDED" && (
            <button className="btn btn-success btn-sm" disabled={saving}
              onClick={() => handleAction(() => adminApi.reactivateAgent(id))}>
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
                <div className="detail-row"><span className="label">Nom</span><span className="value">{agent.name || "—"}</span></div>
                <div className="detail-row"><span className="label">Téléphone</span><span className="value">{agent.phone}</span></div>
                <div className="detail-row"><span className="label">Statut</span><span className="value">{statusBadge(agent.status)}</span></div>
                <div className="detail-row">
                  <span className="label">Validé</span>
                  <span className="value">
                    {agent.validated ? <span className="badge badge-success">Oui</span> : <span className="badge badge-neutral">Non</span>}
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Formation</h2></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14 }}>{training ? "Formation complétée" : "Formation en cours"}</span>
                <button className={`btn btn-sm ${training ? "btn-success" : "btn-outline"}`} disabled={saving}
                  onClick={toggleTraining}>
                  {training ? "Complétée" : "Marquer complétée"}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Notes internes</h2></div>
              <div className="form-group">
                <textarea className="form-input" rows={4} value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes sur l'agent..." />
              </div>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveNotes}>
                Sauvegarder
              </button>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h2>Documents</h2></div>
              <div className="empty">Aucun document disponible</div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Commissions</h2></div>
              {commissions ? (
                <>
                  <div className="detail-row">
                    <span className="label">Total commissions</span>
                    <span className="value">{commissions.total ?? 0} FCFA</span>
                  </div>
                  {commissions.history?.length > 0 && (
                    <div className="table-wrapper" style={{ marginTop: 12 }}>
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Montant</th><th>Type</th></tr>
                        </thead>
                        <tbody>
                          {commissions.history.map((c: any, i: number) => (
                            <tr key={i}>
                              <td>{new Date(c.createdAt || c.date).toLocaleDateString("fr-FR")}</td>
                              <td style={{ fontWeight: 600 }}>{c.amount} FCFA</td>
                              <td><span className="badge badge-info">{c.type || "—"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">Aucune commission</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
