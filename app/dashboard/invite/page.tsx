"use client";

import { useEffect, useState } from "react";
import { apiGet, formatDateTime } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import styles from "../dashboard.module.css";

const accent = "#3d5c4d";

type InviteInfo = { inviteCode: string; invitedCount: number };
type Invitee = {
  userId: string;
  userName: string;
  school: string | null;
  major: string | null;
  reviewStatus: string;
  createdAt: string;
};

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: "未提交", cls: styles.pillNeutral },
  pending: { label: "审核中", cls: styles.pillWarn },
  approved: { label: "已通过", cls: styles.pillOk },
  rejected: { label: "已拒绝", cls: styles.pillBad },
};

export default function InvitePage() {
  const { data: session, isPending } = authClient.useSession();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isPending || !session) return;
    Promise.all([
      apiGet<InviteInfo>("/api/mentors/me/invite"),
      apiGet<{ invitees: Invitee[] }>("/api/mentors/me/invitees"),
    ])
      .then(([inv, list]) => {
        setInfo(inv);
        setInvitees(list.invitees);
      })
      .finally(() => setLoading(false));
  }, [isPending, session]);

  const inviteUrl = info
    ? `${window.location.origin}/auth?role=mentor&mode=register&ref=${info.inviteCode}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending || loading) {
    return <div className={styles.content}>加载中…</div>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <span>指路</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>邀请</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>邀请</h1>
        <p className={styles.pageSub}>
          邀请更多学长学姐加入指路,分享你的专属邀请链接。
        </p>

        {/* Invite link card */}
        <div className={styles.card}>
          <p className={styles.cardSub} style={{ marginBottom: 10 }}>
            你的邀请链接
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              className={styles.input}
              value={inviteUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={{ flex: 1, minWidth: 240 }}
            />
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: accent, whiteSpace: "nowrap" }}
              onClick={handleCopy}
            >
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>
          <p className={styles.cardSub} style={{ marginTop: 10 }}>
            通过此链接注册的学长学姐会自动记录为你的邀请。
          </p>
        </div>

        {/* Stats */}
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardSub}>已邀请人数</p>
          <p className={styles.statValue} style={{ color: accent }}>
            {info?.invitedCount ?? 0}
          </p>
        </div>

        {/* Invitees list */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>邀请记录</h2>
          </div>
          {invitees.length === 0 ? (
            <div className={styles.emptyState}>
              暂无邀请记录,分享你的链接开始邀请吧。
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学校</th>
                  <th>专业</th>
                  <th>审核状态</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {invitees.map((inv) => {
                  const s = statusMap[inv.reviewStatus] || {
                    label: inv.reviewStatus,
                    cls: styles.pillNeutral,
                  };
                  return (
                    <tr key={inv.userId}>
                      <td>{inv.userName || "—"}</td>
                      <td>{inv.school || "—"}</td>
                      <td>{inv.major || "—"}</td>
                      <td>
                        <span className={`${styles.pill} ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td>{formatDateTime(inv.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
