"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mentorAuthClient } from "@/lib/auth-client";
import { apiGet, apiSend, formatDateTime } from "@/lib/api";

type Opt = { id: string; startAt: string };
type Inquiry = {
  id: string;
  role: "parent" | "mentor";
  counterpartName: string | null;
  topic: string | null;
  status: string;
  durationMins: number;
  options: Opt[];
  createdAt: string;
  expiresAt: string;
};

const ACCENT = "#3d5c4d"; // 指路（学长侧）墨绿

export default function PendingInquiryModal() {
  const { data: session, isPending } = mentorAuthClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [list, setList] = useState<Inquiry[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ inquiries: Inquiry[] }>("/api/inquiries");
      if (!mounted.current) return;
      const pendings = res.inquiries
        .filter((i) => i.role === "mentor" && i.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      setList(pendings);
    } catch {
      // 静默失败，下一轮再试
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (isPending || !session || role !== "mentor") return;
    void refresh();
    const poll = setInterval(() => void refresh(), 60000);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mounted.current = false;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPending, session, role, refresh]);

  const queue = list.filter((i) => !dismissed.includes(i.id));
  const current = queue[0] ?? null;
  if (!current) return null;

  const act = async (path: string, body?: unknown) => {
    if (busy) return;
    setBusy(path);
    try {
      await apiSend(path, "POST", body);
      await refresh();
    } catch (e) {
      alert((e as Error).message || "操作失败");
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: ACCENT,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              margin: "0 auto 14px",
            }}
          >
            📅
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: "0 0 6px",
              fontFamily: "var(--serif)",
            }}
          >
            有家长想约你的时间
          </h2>
          <p style={{ fontSize: 14, color: "#4a4a45", margin: 0 }}>
            来自 <strong>{current.counterpartName || "一位家长"}</strong>
            ，选一个你方便的时段确认即可生成订单。
          </p>
        </div>

        {current.topic && (
          <p
            style={{
              fontSize: 14,
              color: "#4a4a45",
              lineHeight: 1.7,
              background: "#f6f5f0",
              borderRadius: 8,
              padding: "10px 12px",
              margin: "0 0 14px",
            }}
          >
            主题：{current.topic}
          </p>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {current.options.map((o) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                border: "1px solid #e4e4de",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 14, color: "#1f1f1f" }}>
                {formatDateTime(o.startAt)} · {current.durationMins} 分钟
              </span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void act(`/api/inquiries/${current.id}/accept`, {
                    optionId: o.id,
                  })
                }
                style={{
                  background: ACCENT,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy !== null ? "not-allowed" : "pointer",
                  opacity: busy !== null ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {busy === `/api/inquiries/${current.id}/accept`
                  ? "确认中…"
                  : "确认这个"}
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#9a9a93", margin: "12px 0 0" }}>
          {formatDateTime(current.expiresAt)} 前有效
          {queue.length > 1 && ` · 还有 ${queue.length - 1} 条待处理`}
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void act(`/api/inquiries/${current.id}/decline`)}
            style={{
              background: "none",
              border: "1px solid #d8d4c8",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 14,
              color: "#6e6e68",
              cursor: busy !== null ? "not-allowed" : "pointer",
            }}
          >
            婉拒
          </button>
          <button
            type="button"
            onClick={() => setDismissed((d) => [...d, current.id])}
            style={{
              background: "none",
              border: "none",
              color: "#8a857a",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
