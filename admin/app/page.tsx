"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const user = JSON.parse(localStorage.getItem("admin_user") || "null");
    if (token && user?.role === "SUPER_ADMIN") router.replace("/dashboard");
    else if (token && user?.role === "ADMIN") router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);
  return <div className="loading"><div className="spinner" /></div>;
}
