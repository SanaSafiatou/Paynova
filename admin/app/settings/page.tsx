"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { settingsApi } from "../../src/lib/api";

interface SettingEntry {
  label: string;
  type: string;
  unit?: string;
  value: any;
  min?: number;
  max?: number;
}

const TABS = ["Frais", "Commissions", "Plafonds", "Montants min", "Général", "Sécurité", "Notifications"] as const;

const GROUP_MAP: Record<string, string> = {
  fees: "Frais",
  commission: "Commissions",
  daily: "Plafonds",
  min: "Montants min",
  general: "Général",
  security: "Sécurité",
  notification: "Notifications",
};

function groupKey(key: string): string {
  for (const prefix of Object.keys(GROUP_MAP)) {
    if (key.startsWith(prefix + ".") || key === prefix) return GROUP_MAP[prefix];
  }
  return "Général";
}

const TOGGLE_KEYS = new Set([
  "notification.enabled",
  "notification.depositAlerts",
  "notification.withdrawalAlerts",
  "notification.dailyReport",
]);

const LABELS: Record<string, string> = {
  "fees.deposit": "Dépôt",
  "fees.withdrawal": "Retrait",
  "fees.transfer": "Transfert",
  "fees.payment": "Paiement",
  "fees.minAmount": "Montant minimum",
  "commission.agent": "Agent",
  "commission.merchant": "Commerçant",
  "commission.referral": "Parrainage",
  "dailyWithdrawal": "Retrait journalier",
  "dailyDeposit": "Dépôt journalier",
  "dailyTransfer": "Transfert journalier",
  "minWithdrawal": "Retrait minimum",
  "minDeposit": "Dépôt minimum",
  "minTransfer": "Transfert minimum",
  "general.whatsappNumber": "Numéro WhatsApp",
  "general.currency": "Devise",
  "security.maxPinAttempts": "Tentatives PIN max",
  "security.pinLockoutDuration": "Durée blocage PIN",
  "security.otpExpiry": "Durée OTP",
  "notification.enabled": "Notifications activées",
  "notification.depositAlerts": "Alertes dépôt",
  "notification.withdrawalAlerts": "Alertes retrait",
  "notification.dailyReport": "Rapport quotidien",
};

export default function SettingsPage() {
  const [allSettings, setAllSettings] = useState<Record<string, SettingEntry>>({});
  const [changed, setChanged] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);

  useEffect(() => {
    settingsApi.getAll()
      .then((data) => setAllSettings(data))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = Object.entries(allSettings).reduce<Record<string, [string, SettingEntry][]>>((acc, [key, entry]) => {
    const tab = groupKey(key);
    if (!acc[tab]) acc[tab] = [];
    acc[tab].push([key, entry]);
    return acc;
  }, {});

  const currentSettings = grouped[activeTab] ?? [];

  const getValue = (key: string) => {
    if (key in changed) return changed[key];
    return allSettings[key]?.value ?? "";
  };

  const handleChange = (key: string, val: any) => {
    setChanged((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (Object.keys(changed).length === 0) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(changed)) {
        payload[k] = v;
      }
      await settingsApi.update(payload);
      const fresh = await settingsApi.getAll();
      setAllSettings(fresh);
      setChanged({});
      setSuccess("Paramètres sauvegardés");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px" }}>
        <div>
          <h1>Paramètres</h1>
          <p>Configuration de la plateforme PayNova</p>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: "var(--danger)" }}>{error}</div>}
      {success && <div className="card" style={{ marginBottom: 16, color: "var(--success)" }}>{success}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-bar">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`filter-chip ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{activeTab}</h2>
        </div>
        <div style={{ padding: "16px 0" }}>
          {currentSettings.length === 0 ? (
            <p className="empty">Aucun paramètre dans cette catégorie</p>
          ) : (
            currentSettings.map(([key, entry]) => {
              const isToggle = TOGGLE_KEYS.has(key);
              const label = LABELS[key] ?? entry.label ?? key;
              const val = getValue(key);

              return (
                <div className="form-row" key={key} style={{ alignItems: "center", marginBottom: 16 }}>
                  <label className="form-group" style={{ minWidth: 200, margin: 0 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{key}</span>
                  </label>

                  {isToggle ? (
                    <button
                      className={`btn btn-sm ${val ? "btn-success" : "btn-outline"}`}
                      onClick={() => handleChange(key, !val)}
                      style={{ minWidth: 120 }}
                    >
                      {val ? "Activé" : "Désactivé"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {entry.type === "number" || typeof val === "number" ? (
                        <input
                          className="form-input"
                          type="number"
                          value={val}
                          min={entry.min}
                          max={entry.max}
                          onChange={(e) => handleChange(key, Number(e.target.value))}
                          style={{ maxWidth: 200 }}
                        />
                      ) : (
                        <input
                          className="form-input"
                          type="text"
                          value={val}
                          onChange={(e) => handleChange(key, e.target.value)}
                          style={{ maxWidth: 200 }}
                        />
                      )}
                      {entry.unit && (
                        <span style={{ fontWeight: 600, color: "var(--text-secondary)", minWidth: 40 }}>
                          {entry.unit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {Object.keys(changed).length > 0 && (
          <div style={{ padding: "16px 0", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
