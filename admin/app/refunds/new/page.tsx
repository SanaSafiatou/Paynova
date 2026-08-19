"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "../../../src/lib/api";

type Step = "transaction" | "debit" | "amount" | "credit" | "reason" | "recap";

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "transaction", label: "Transaction", icon: "1" },
  { key: "debit", label: "Compte débité", icon: "2" },
  { key: "amount", label: "Montant", icon: "3" },
  { key: "credit", label: "Compte crédité", icon: "4" },
  { key: "reason", label: "Motif", icon: "5" },
  { key: "recap", label: "Récapitulatif", icon: "6" },
];

function UserSearchPicker({
  label,
  placeholder,
  selected,
  onSelect,
  excludeId,
}: {
  label: string;
  placeholder: string;
  selected: any | null;
  onSelect: (user: any) => void;
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setSearching(true);
      try {
        const res = await adminApi.users({ q: q.trim(), limit: "8" });
        const filtered = (res.users ?? []).filter((u: any) => u.id !== excludeId);
        setResults(filtered);
        setOpen(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    },
    [excludeId]
  );

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (user: any) => {
    onSelect(user);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: "block" }}>{label}</label>
      {selected ? (
        <div
          className="card"
          style={{
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderColor: "var(--primary)",
            background: "#f5f3ff",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name || "Sans nom"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {selected.phone} &middot; {Number(selected.balance ?? 0).toLocaleString("fr-FR")} FC &middot;{" "}
              <span className={`badge ${selected.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                {selected.status}
              </span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onSelect(null)}
            type="button"
          >
            Retirer
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="form-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
          />
          {searching && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Recherche...</div>}
          {open && results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                zIndex: 50,
                maxHeight: 260,
                overflowY: "auto",
                marginTop: 4,
              }}
            >
              {results.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-light)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || "Sans nom"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {u.phone} &middot; {Number(u.balance ?? 0).toLocaleString("fr-FR")} FC &middot; {u.role}
                  </div>
                </div>
              ))}
            </div>
          )}
          {open && query && results.length === 0 && !searching && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                zIndex: 50,
                padding: 16,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Aucun utilisateur trouvé
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function NewRefundPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("transaction");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Transaction search
  const [txQuery, setTxQuery] = useState("");
  const [txSearching, setTxSearching] = useState(false);
  const [txResults, setTxResults] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Accounts
  const [debitUser, setDebitUser] = useState<any>(null);
  const [creditUser, setCreditUser] = useState<any>(null);

  // Amount & reason
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  // --- Transaction search ---
  const handleTxSearch = async () => {
    if (!txQuery.trim()) return;
    setTxSearching(true);
    setError("");
    try {
      const res = await adminApi.searchTransactionsForRefund(txQuery.trim());
      setTxResults(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTxSearching(false);
    }
  };

  const handleSelectTx = (tx: any) => {
    setSelectedTx(tx);
    setTxResults([]);
    setTxQuery("");
    setStep("debit");
  };

  const handleClearTx = () => {
    setSelectedTx(null);
    setDebitUser(null);
    setCreditUser(null);
    setRefundAmount("");
    setReason("");
    setNote("");
    setStep("transaction");
  };

  // --- Validation helpers ---
  const amountNum = Number(refundAmount);
  const maxAmount = selectedTx ? Number(selectedTx.amount) : 0;
  const debitBalance = debitUser ? Number(debitUser.balance ?? 0) : 0;
  const hasInsufficientBalance = debitUser && amountNum > 0 && amountNum > debitBalance;

  const canProceedFromAmount = amountNum > 0 && amountNum <= maxAmount;
  const canValidate =
    selectedTx &&
    debitUser &&
    creditUser &&
    amountNum > 0 &&
    amountNum <= maxAmount &&
    debitBalance >= amountNum &&
    reason.trim().length > 0;

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canValidate) {
      setError("Veuillez compléter tous les champs et vérifier les soldes");
      return;
    }
    if (!confirm(`Confirmer le remboursement de ${amountNum.toLocaleString("fr-FR")} FC ?`)) return;

    setSubmitting(true);
    setError("");
    try {
      await adminApi.createRefund({
        transactionId: selectedTx.id,
        refundAmount: amountNum,
        reason: reason.trim(),
        debitUserId: debitUser.id,
        creditUserId: creditUser.id,
        note: note.trim() || undefined,
      });
      router.push("/refunds");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Step navigation ---
  const goNext = () => {
    setError("");
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };
  const goBack = () => {
    setError("");
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const stepIndex = (key: Step) => STEPS.findIndex((s) => s.key === key);

  return (
    <div style={{ padding: 32, maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header" style={{ margin: "-32px -32px 24px", padding: "20px 32px", maxWidth: 760, marginLeft: -32, marginRight: -32 }}>
        <div>
          <h1>Nouveau remboursement</h1>
          <p>Créer un remboursement administratif complet</p>
        </div>
        <button className="btn btn-outline" onClick={() => router.back()}>
          ← Retour
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= currentIdx ? "var(--primary)" : "var(--border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              fontSize: 11,
              fontWeight: i <= currentIdx ? 700 : 400,
              color: i <= currentIdx ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
              textAlign: "center",
              flex: 1,
            }}
            onClick={() => {
              if (i < currentIdx) setStep(s.key);
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 22,
                height: 22,
                borderRadius: "50%",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                background: i <= currentIdx ? "var(--primary)" : "var(--border)",
                color: i <= currentIdx ? "#fff" : "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              {i < currentIdx ? "✓" : s.icon}
            </span>
            <div>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--danger-bg)",
            color: "var(--danger)",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 16,
            border: "1px solid var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* ============ STEP: TRANSACTION ============ */}
      {step === "transaction" && (
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Rechercher la transaction</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Entrez la référence ou l&apos;ID de la transaction à rembourser
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Référence ou ID..."
              value={txQuery}
              onChange={(e) => setTxQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTxSearch()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleTxSearch} disabled={txSearching}>
              {txSearching ? "Recherche..." : "Rechercher"}
            </button>
          </div>

          {txResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                {txResults.length} résultat(s)
              </div>
              {txResults.map((tx) => (
                <div
                  key={tx.id}
                  className="card"
                  style={{ cursor: "pointer", marginBottom: 8, padding: 14, border: "1.5px solid var(--border)" }}
                  onClick={() => handleSelectTx(tx)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                        {tx.reference || tx.id?.slice(0, 12)}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                        {Number(tx.amount).toLocaleString("fr-FR")} FC
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        {tx.type} &middot; {tx.status} &middot; Client: {tx.client?.phone || "—"} &middot; Agent: {tx.agent?.phone || "—"}
                      </div>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: 18 }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {txSearching && txResults.length === 0 && (
            <div style={{ padding: 20, textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          )}
        </div>
      )}

      {/* ============ STEP: SELECTED TRANSACTION + DEBIT ACCOUNT ============ */}
      {step === "debit" && selectedTx && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Transaction</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--primary)" }}>{selectedTx.reference || selectedTx.id}</div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={handleClearTx}>Changer</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12, padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Type</div><div style={{ fontWeight: 700 }}>{selectedTx.type}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Montant</div><div style={{ fontWeight: 700 }}>{Number(selectedTx.amount).toLocaleString("fr-FR")} FC</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Client</div><div style={{ fontWeight: 700 }}>{selectedTx.client?.phone || "—"}</div></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Compte à débiter</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Recherchez et sélectionnez le compte dont le solde sera débité
            </p>
            <UserSearchPicker
              label=""
              placeholder="Nom ou numéro de téléphone..."
              selected={debitUser}
              onSelect={setDebitUser}
            />
            {debitUser && (
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1, padding: 12, background: "#FEF2F2", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Solde disponible</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: Number(debitUser.balance ?? 0) > 0 ? "#16A34A" : "var(--danger)" }}>
                    {Number(debitUser.balance ?? 0).toLocaleString("fr-FR")} FC
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-primary" disabled={!debitUser} onClick={goNext}>
                Continuer →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ STEP: AMOUNT ============ */}
      {step === "amount" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Transaction</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--primary)" }}>{selectedTx?.reference || selectedTx?.id}</div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Compte débité</div>
            <div style={{ fontWeight: 700 }}>{debitUser?.name || "Sans nom"} — {debitUser?.phone}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Solde: {Number(debitUser?.balance ?? 0).toLocaleString("fr-FR")} FC</div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Montant du remboursement</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Montant maximum: <strong>{maxAmount.toLocaleString("fr-FR")} FC</strong>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                className="form-input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0"
                min={1}
                max={maxAmount}
                style={{ fontSize: 24, fontWeight: 800, textAlign: "center", maxWidth: 250 }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}>FC</span>
            </div>
            {refundAmount && amountNum > maxAmount && (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
                Le montant ne peut pas dépasser {maxAmount.toLocaleString("fr-FR")} FC
              </div>
            )}
            {refundAmount && amountNum > 0 && debitUser && amountNum > debitBalance && (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
                Solde insuffisant sur le compte débité ({debitBalance.toLocaleString("fr-FR")} FC disponible)
              </div>
            )}
            {refundAmount && amountNum > 0 && amountNum <= maxAmount && debitUser && amountNum <= debitBalance && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#16A34A", fontWeight: 500 }}>
                Montant valide ✓
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button className="btn btn-outline" onClick={goBack}>← Retour</button>
              <button className="btn btn-primary" disabled={!canProceedFromAmount || hasInsufficientBalance} onClick={goNext}>
                Continuer →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ STEP: CREDIT ACCOUNT ============ */}
      {step === "credit" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Transaction</div><div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>{selectedTx?.reference}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Montant</div><div style={{ fontWeight: 700 }}>{amountNum.toLocaleString("fr-FR")} FC</div></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Compte à créditer</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Recherchez et sélectionnez le compte qui recevra l&apos;argent
            </p>
            <UserSearchPicker
              label=""
              placeholder="Nom ou numéro de téléphone..."
              selected={creditUser}
              onSelect={setCreditUser}
              excludeId={debitUser?.id}
            />
            {creditUser && (
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1, padding: 12, background: "#F0FDF4", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Solde actuel</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#16A34A" }}>
                    {Number(creditUser.balance ?? 0).toLocaleString("fr-FR")} FC
                  </div>
                </div>
                <div style={{ flex: 1, padding: 12, background: "#EFF6FF", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Après remboursement</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "var(--info)" }}>
                    {Number(creditUser.balance ?? 0 + amountNum).toLocaleString("fr-FR")} FC
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button className="btn btn-outline" onClick={goBack}>← Retour</button>
              <button className="btn btn-primary" disabled={!creditUser} onClick={goNext}>
                Continuer →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ STEP: REASON ============ */}
      {step === "reason" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Transaction</div><div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>{selectedTx?.reference}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Débit</div><div style={{ fontSize: 12, fontWeight: 600 }}>{debitUser?.phone}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Crédit</div><div style={{ fontSize: 12, fontWeight: 600 }}>{creditUser?.phone}</div></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Motif du remboursement</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>
                Raison <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Transaction en double, erreur de montant, annulation client..."
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>
                Note interne (optionnel)
              </label>
              <textarea
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-outline" onClick={goBack}>← Retour</button>
              <button className="btn btn-primary" disabled={!reason.trim()} onClick={goNext}>
                Voir le récapitulatif →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ STEP: RECAP ============ */}
      {step === "recap" && (
        <>
          <div
            className="card"
            style={{
              marginBottom: 16,
              border: "2px solid var(--primary)",
              background: "linear-gradient(135deg, #f5f3ff 0%, #fff 100%)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>
                Récapitulatif du remboursement
              </div>
            </div>

            {/* Transaction */}
            <div style={{ padding: 12, background: "rgba(124,58,237,0.05)", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Transaction originale</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>Référence:</span> <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{selectedTx?.reference}</span></div>
                <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>Type:</span> <span style={{ fontWeight: 600 }}>{selectedTx?.type}</span></div>
                <div><span style={{ fontSize: 11, color: "var(--text-muted)" }}>Montant:</span> <span style={{ fontWeight: 600 }}>{Number(selectedTx?.amount ?? 0).toLocaleString("fr-FR")} FC</span></div>
              </div>
            </div>

            {/* Flux financier */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 1fr", gap: 0, marginBottom: 16 }}>
              <div style={{ padding: 16, background: "var(--danger-bg)", borderRadius: "8px 0 0 8px", border: "1px solid #FECACA" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>DEBIT</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{debitUser?.name || "Sans nom"}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{debitUser?.phone}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Solde: {Number(debitUser?.balance ?? 0).toLocaleString("fr-FR")} FC → {Number((debitUser?.balance ?? 0) - amountNum).toLocaleString("fr-FR")} FC
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--primary)", fontWeight: 800 }}>
                →
              </div>
              <div style={{ padding: 16, background: "#F0FDF4", borderRadius: "0 8px 8px 0", border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", marginBottom: 4 }}>CREDIT</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{creditUser?.name || "Sans nom"}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{creditUser?.phone}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Solde: {Number(creditUser?.balance ?? 0).toLocaleString("fr-FR")} FC → {Number((creditUser?.balance ?? 0) + amountNum).toLocaleString("fr-FR")} FC
                </div>
              </div>
            </div>

            {/* Montant */}
            <div style={{ textAlign: "center", padding: 16, background: "#f8f9fc", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>MONTANT DU REMBOURSEMENT</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>
                {amountNum.toLocaleString("fr-FR")} <span style={{ fontSize: 16 }}>FC</span>
              </div>
            </div>

            {/* Motif */}
            <div style={{ padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Motif</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{reason}</div>
              {note && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{note}</div>}
            </div>
          </div>

          {/* Vérifications */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Vérifications</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: selectedTx ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{selectedTx ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>Transaction sélectionnée</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: debitUser ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{debitUser ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>Compte débité sélectionné</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: creditUser ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{creditUser ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>Compte crédité sélectionné</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: amountNum > 0 && amountNum <= maxAmount ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{amountNum > 0 && amountNum <= maxAmount ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>Montant valide ({amountNum.toLocaleString("fr-FR")} / {maxAmount.toLocaleString("fr-FR")} FC)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: !hasInsufficientBalance && debitUser ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{!hasInsufficientBalance && debitUser ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>
                  Solde débiteur suffisant ({debitBalance.toLocaleString("fr-FR")} FC disponible)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: reason.trim() ? "#16A34A" : "var(--danger)", fontSize: 16 }}>{reason.trim() ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13 }}>Motif renseigné</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1, padding: 14 }} onClick={goBack}>
              ← Modifier
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, padding: 14, fontSize: 15 }}
              disabled={!canValidate || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Enregistrement..." : `Valider le remboursement — ${amountNum.toLocaleString("fr-FR")} FC`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
