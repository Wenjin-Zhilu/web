"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { apiGet, apiSend, formatDateTime } from "@/lib/api";
import styles from "../dashboard.module.css";

type Opt = { id: string; startAt: string };
type Inquiry = {
  id: string;
  role: "parent" | "mentor";
  counterpartName: string | null;
  counterpartSchool: string | null;
  topic: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  durationMins: number;
  acceptedOptionId: string | null;
  resultOrderId: string | null;
  expiresAt: string;
  createdAt: string;
  options: Opt[];
};

const STATUS_LABEL: Record<Inquiry["status"], string> = {
  pending: "等待确认",
  accepted: "已确认",
  declined: "已婉拒",
  expired: "已过期",
  cancelled: "已撤回",
};

export default function InquiriesPage() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "parent";
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";

  const [list, setList] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ inquiries: Inquiry[] }>("/api/inquiries");
      setList(res.inquiries);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending || !session) return;
    void load();
  }, [isPending, session, load]);

  const act = async (path: string, body?: unknown) => {
    setBusy(path);
    try {
      await apiSend(path, "POST", body);
      await load();
    } catch (e) {
      alert((e as Error).message || "操作失败");
    } finally {
      setBusy(null);
    }
  };

  if (isPending || loading) {
    return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <span>{role === "mentor" ? "指路" : "问津"}</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>时间问询</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>时间问询</h1>
        <p className={styles.pageSub}>
          {role === "mentor"
            ? "家长希望约你这些时间，确认其中一个即可生成订单。"
            : "你向学长提出的候选时间，学长确认后即可去支付。"}
        </p>

        {list.length === 0 ? (
          <div className={styles.emptyState}>暂时没有时间问询。</div>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
            {list.map((inq) => (
              <div key={inq.id} className={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8,
                  }}
                >
                  <h3 className={styles.cardTitle}>
                    {role === "mentor" ? "家长" : "学长"}：{inq.counterpartName || "对方"}
                    {inq.counterpartSchool ? ` · ${inq.counterpartSchool}` : ""}
                  </h3>
                  <span className={`${styles.pill} ${styles.pillNeutral}`}>
                    {STATUS_LABEL[inq.status]}
                  </span>
                </div>
                {inq.topic && (
                  <p style={{ fontSize: 14, color: "#4a4a45", lineHeight: 1.7, marginBottom: 10 }}>
                    主题：{inq.topic}
                  </p>
                )}
                <div style={{ display: "grid", gap: 8 }}>
                  {inq.options.map((o) => {
                    const isAccepted = inq.acceptedOptionId === o.id;
                    return (
                      <div
                        key={o.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          border: `1px solid ${isAccepted ? accent : "#e4e4de"}`,
                          borderRadius: 8,
                        }}
                      >
                        <span style={{ fontSize: 14, color: "#1f1f1f" }}>
                          {formatDateTime(o.startAt)} · {inq.durationMins} 分钟
                          {isAccepted && (
                            <span style={{ color: accent, marginLeft: 8, fontSize: 13 }}>已确认</span>
                          )}
                        </span>
                        {role === "mentor" && inq.status === "pending" && (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => act(`/api/inquiries/${inq.id}/accept`, { optionId: o.id })}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ background: accent, padding: "6px 14px", fontSize: 13 }}
                          >
                            确认这个
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p style={{ fontSize: 12, color: "#9a9a93", marginTop: 10 }}>
                  发起于 {formatDateTime(inq.createdAt)}
                  {inq.status === "pending" && ` · ${formatDateTime(inq.expiresAt)} 前有效`}
                </p>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {role === "mentor" && inq.status === "pending" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => act(`/api/inquiries/${inq.id}/decline`)}
                      className={`${styles.btn} ${styles.btnGhost}`}
                    >
                      婉拒
                    </button>
                  )}
                  {role === "parent" && inq.status === "pending" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => act(`/api/inquiries/${inq.id}/cancel`)}
                      className={`${styles.btn} ${styles.btnGhost}`}
                    >
                      撤回
                    </button>
                  )}
                  {role === "parent" && inq.status === "accepted" && inq.resultOrderId && (
                    <Link
                      href={`/pay/${inq.resultOrderId}`}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ background: accent }}
                    >
                      去支付
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
