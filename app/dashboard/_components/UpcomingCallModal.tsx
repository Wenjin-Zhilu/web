"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { apiGet, apiSend, formatDateTime } from "@/lib/api";

type CallOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  callSessionId: string | null;
  slotStartAt: string | null;
  slotDurationMins: number | null;
  counterpartName: string | null;
};

const PRE_WINDOW_MS = 15 * 60 * 1000; // 开始前 15 分钟起提醒
const POST_WINDOW_MS = 10 * 60 * 1000; // 结束后 10 分钟内仍可进入
const ENTER_LEAD_MS = 5 * 60 * 1000; // 到点前 5 分钟方可进入（对齐后端 start-call 校验）

export default function UpcomingCallModal() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "parent";
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";

  const [hit, setHit] = useState<CallOrder | null>(null);
  const [now, setNow] = useState(0);
  const [entering, setEntering] = useState(false);
  const dismissedRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ orders: CallOrder[] }>("/api/orders");
      const t = Date.now();
      const candidates = res.orders.filter((o) => {
        if (o.status !== "scheduled" && o.status !== "in_call") return false;
        if (o.paymentStatus !== "paid") return false;
        if (!o.slotStartAt) return false;
        const start = new Date(o.slotStartAt).getTime();
        const dur = (o.slotDurationMins ?? 30) * 60 * 1000;
        return t >= start - PRE_WINDOW_MS && t <= start + dur + POST_WINDOW_MS;
      });
      candidates.sort(
        (a, b) => new Date(a.slotStartAt!).getTime() - new Date(b.slotStartAt!).getTime()
      );
      const next = candidates[0] ?? null;
      setHit(next && dismissedRef.current === next.id ? null : next);
    } catch {
      // 静默失败，下一轮再试
    }
  }, []);

  useEffect(() => {
    if (isPending || !session) return;
    void refresh();
    const poll = setInterval(() => void refresh(), 30000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPending, session, refresh]);

  if (!hit || !hit.slotStartAt) return null;

  const start = new Date(hit.slotStartAt).getTime();
  const currentMs = now || Date.now();
  const canEnter = currentMs >= start - ENTER_LEAD_MS;
  const secsToOpen = Math.max(0, Math.ceil((start - ENTER_LEAD_MS - currentMs) / 1000));
  const peer = hit.counterpartName || "对方";

  const enter = async () => {
    if (entering) return;
    setEntering(true);
    try {
      const res = await apiSend<{ sessionId: string }>(
        `/api/orders/${hit.id}/start-call`,
        "POST"
      );
      router.push(`/call/${res.sessionId}`);
    } catch (e) {
      console.error(e);
      setEntering(false);
    }
  };

  const fmtCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
          padding: "36px 32px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 18px",
          }}
        >
          📞
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", fontFamily: "var(--serif)" }}>
          预约通话即将开始
        </h2>
        <p style={{ fontSize: 15, color: "#4a4a45", margin: "0 0 4px" }}>
          和 <strong>{peer}</strong> 的咨询通话
        </p>
        <p style={{ fontSize: 13, color: "#8a857a", margin: "0 0 22px" }}>
          {formatDateTime(hit.slotStartAt)}
        </p>
        <button
          onClick={() => void enter()}
          disabled={!canEnter || entering}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: canEnter ? accent : "#cfcabd",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: canEnter ? "pointer" : "not-allowed",
          }}
        >
          {entering
            ? "进入中…"
            : canEnter
              ? "进入通话"
              : `将在 ${fmtCountdown(secsToOpen)} 后开放`}
        </button>
        <button
          onClick={() => {
            dismissedRef.current = hit.id;
            setHit(null);
          }}
          style={{
            marginTop: 12,
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
  );
}
