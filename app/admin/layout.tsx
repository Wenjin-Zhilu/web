"use client";

import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import styles from "../dashboard/dashboard.module.css";

type Authed = boolean | null;

const ADMIN_ACCENT = "#1a1a1a";

const AdminCtx = createContext<{ refresh: () => void } | null>(null);

export function useAdminCtx() {
  const v = useContext(AdminCtx);
  if (!v) throw new Error("useAdminCtx outside provider");
  return v;
}

const nav = [
  { href: "/admin", label: "待审核", match: (p: string) => p === "/admin" },
  { href: "/admin/mentors", label: "学长学姐", match: (p: string) => p.startsWith("/admin/mentors") },
  { href: "/admin/parents", label: "家长", match: (p: string) => p.startsWith("/admin/parents") },
  { href: "/admin/orders", label: "订单", match: (p: string) => p.startsWith("/admin/orders") },
  { href: "/admin/withdrawals", label: "提现", match: (p: string) => p.startsWith("/admin/withdrawals") },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<Authed>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await apiGet<{ authed: boolean }>("/api/admin/session");
        if (!cancel) setAuthed(r.authed);
      } catch {
        if (!cancel) setAuthed(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (authed === null) {
    return <div className={styles.loading}>加载中…</div>;
  }
  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <AdminCtx.Provider value={{ refresh: () => setTick((t) => t + 1) }}>
      <div className={styles.shell} key={tick}>
        <AdminSidebar onLogout={() => setAuthed(false)} />
        <div
          className={styles.main}
          style={{ ["--accent" as string]: ADMIN_ACCENT } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname() || "/admin";
  const signOut = async () => {
    try {
      await apiSend("/api/admin/logout", "POST");
    } catch {
      // ignore
    }
    onLogout();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo} style={{ background: ADMIN_ACCENT }}>
          A
        </div>
        <span className={styles.brandText}>问津 · 后台</span>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navGroupLabel}>导航</div>
        {nav.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              style={active ? { color: ADMIN_ACCENT } : undefined}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: active ? ADMIN_ACCENT : "#c0bfb6",
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.userBlock}>
          <div className={styles.userAvatar}>A</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>Admin</span>
            <span className={styles.userRole}>管理员</span>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={signOut}>
          登出
        </button>
      </div>
    </aside>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await apiSend("/api/admin/login", "POST", { password });
      onSuccess();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--sans)",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 360,
          border: "1px solid #ececec",
          borderRadius: 10,
          padding: 28,
          background: "#fff",
        }}
      >
        <div style={{ fontSize: 11, color: "#9a9a93", letterSpacing: 2, textTransform: "uppercase" }}>
          ADMIN
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 4px", color: "#1f1f1f", fontFamily: "var(--serif)" }}>
          后台登录
        </h1>
        <p style={{ fontSize: 13, color: "#6e6e68", margin: "0 0 20px" }}>请输入管理员密码。</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          className={styles.input}
        />
        {err && (
          <div style={{ marginTop: 12, color: "#a4391a", fontSize: 13 }}>{err}</div>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{
            marginTop: 16,
            width: "100%",
            justifyContent: "center",
            background: busy ? "#444" : "#1a1a1a",
          }}
        >
          {busy ? "登录中…" : "登录"}
        </button>
      </form>
    </div>
  );
}
