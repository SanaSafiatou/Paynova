"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fullPhone = `+225${phone}`;
    if (phone.length < 8 || phone.length > 10) {
      setError("Numéro invalide (8 à 10 chiffres).");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("Le PIN doit contenir 4 chiffres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Connexion échouée");
      if (data.user.role !== "ADMIN" && data.user.role !== "SUPER_ADMIN") {
        throw new Error("Accès réservé aux administrateurs");
      }
      localStorage.setItem("admin_token", data.accessToken);
      localStorage.setItem("admin_refresh_token", data.refreshToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Pay<span>Nova</span></h1>
          <p>Panneau d&apos;administration</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Numéro de téléphone</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="form-input" style={{ width: 80, flexShrink: 0 }} value="+225" readOnly />
              <input className="form-input" placeholder="07 01 02 03 04" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} autoFocus />
            </div>
          </div>
          <div className="form-group">
            <label>Code PIN</label>
            <input className="form-input" type="password" placeholder="4 chiffres" value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
