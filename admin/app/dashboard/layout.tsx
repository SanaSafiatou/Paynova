"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/users", label: "Utilisateurs", icon: "👥" },
  { href: "/transactions", label: "Transactions", icon: "💳" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/merchants", label: "Commerçants", icon: "🏪" },
  { href: "/withdrawals", label: "Retraits", icon: "💰" },
  { href: "/refunds", label: "Remboursements", icon: "🔄" },
  { href: "/audit", label: "Audit", icon: "📋" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const stored = localStorage.getItem("admin_user");
    if (!token || !stored) { router.replace("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "ADMIN" && u.role !== "SUPER_ADMIN") { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    router.replace("/login");
  };

  if (!user) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Pay<span>Nova</span></div>
          <div className="sidebar-role">{user.role === "SUPER_ADMIN" ? "Super Administrateur" : "Administrateur"}</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "active" : ""}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 13, color: "#A0AEC0", marginBottom: 8 }}>
            {user.name || user.phone}
          </div>
          <button onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
