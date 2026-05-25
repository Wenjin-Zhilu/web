"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAll } from "@/lib/auth-client";
import styles from "../dashboard.module.css";

export type NavItem = {
  href: string;
  label: string;
  matches?: (path: string) => boolean;
};

const parentNav: NavItem[] = [
  { href: "/dashboard", label: "概览", matches: (p) => p === "/dashboard" },
  { href: "/dashboard/reviews", label: "院校评价", matches: (p) => p.startsWith("/dashboard/reviews") },
  { href: "/dashboard/match", label: "匹配", matches: (p) => p.startsWith("/dashboard/match") },
  { href: "/dashboard/orders", label: "我的咨询", matches: (p) => p.startsWith("/dashboard/orders") },
  { href: "/dashboard/profile", label: "我的资料", matches: (p) => p.startsWith("/dashboard/profile") },
];

const mentorNav: NavItem[] = [
  { href: "/dashboard", label: "概览", matches: (p) => p === "/dashboard" },
  { href: "/dashboard/profile", label: "资料与审核", matches: (p) => p.startsWith("/dashboard/profile") },
  { href: "/dashboard/slots", label: "时间档期", matches: (p) => p.startsWith("/dashboard/slots") },
  { href: "/dashboard/orders", label: "订单", matches: (p) => p.startsWith("/dashboard/orders") },
  { href: "/dashboard/wallet", label: "钱包", matches: (p) => p.startsWith("/dashboard/wallet") },
  { href: "/dashboard/invite", label: "邀请", matches: (p) => p.startsWith("/dashboard/invite") },
];

export function Sidebar({
  role,
  name,
  email,
  accent,
  side,
}: {
  role: "parent" | "mentor";
  name: string;
  email: string;
  accent: string;
  side: string;
}) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const nav = role === "mentor" ? mentorNav : parentNav;

  const initial = (name || email || "?").charAt(0).toUpperCase();
  const brandChar = role === "mentor" ? "路" : "问";

  const signOut = async () => {
    await signOutAll();
    router.push("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo} style={{ background: accent }}>
          {brandChar}
        </div>
        <span className={styles.brandText}>{side}</span>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navGroupLabel}>导航</div>
        {nav.map((item) => {
          const active = item.matches ? item.matches(pathname) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              style={active ? { color: accent } : undefined}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: active ? accent : "#c0bfb6" }} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.userBlock}>
          <div className={styles.userAvatar}>{initial}</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{name || email}</span>
            <span className={styles.userRole}>{role === "mentor" ? "学长 / 学姐" : "家长 / 学生"}</span>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={signOut}>
          登出
        </button>
      </div>
    </aside>
  );
}

export { styles };
