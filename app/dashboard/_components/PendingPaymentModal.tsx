"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parentAuthClient } from "@/lib/auth-client";
import { apiGet, formatCents, formatDateTime } from "@/lib/api";

type Order = {
  id: string;
  status: string;
  paymentStatus: "unpaid" | "waiting" | "paid" | "closed" | "refunded";
  priceCents?: number;
  slotStartAt: string | null;
  slotDurationMins: number | null;
  counterpartName: string | null;
  createdAt: string;
};

const ACCENT = "#b8472d"; // 问津（家长侧）砖红

export default function PendingPaymentModal() {
  const router = useRouter();
  const { data: session, isPending } = parentAuthClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [list, setList] = useState<Order[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ orders: Order[] }>("/api/orders");
      if (!mounted.current) return;
      const unpaid = res.orders
        .filter(
          (o) =>
            o.status === "scheduled" &&
            (o.paymentStatus === "unpaid" || o.paymentStatus === "waiting")
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      setList(unpaid);
    } catch {
      // 静默失败，下一轮再试
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (isPending || !session || role !== "parent") return;
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

  const queue = list.filter((o) => !dismissed.includes(o.id));
  const current = queue[0] ?? null;
  if (!current) return null;

  const waiting = current.paymentStatus === "waiting";

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
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
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
          💰
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 6px",
            fontFamily: "var(--serif)",
          }}
        >
          学长已确认，待你支付
        </h2>
        <p style={{ fontSize: 14, color: "#4a4a45", margin: "0 0 4px" }}>
          和 <strong>{current.counterpartName || "学长"}</strong> 的咨询通话
        </p>
        {current.slotStartAt && (
          <p style={{ fontSize: 13, color: "#8a857a", margin: "0 0 4px" }}>
            {formatDateTime(current.slotStartAt)}
            {current.slotDurationMins ? ` · ${current.slotDurationMins} 分钟` : ""}
          </p>
        )}
        {current.priceCents != null && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: ACCENT,
              margin: "10px 0 18px",
            }}
          >
            {formatCents(current.priceCents)}
          </p>
        )}
        {waiting && (
          <p style={{ fontSize: 12, color: "#8a857a", margin: "-8px 0 16px" }}>
            支付已发起，若未完成扣款可继续支付。
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push(`/pay/${current.id}`)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: ACCENT,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {waiting ? "继续支付" : "去支付"}
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            marginTop: 12,
          }}
        >
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
          {queue.length > 1 && (
            <span style={{ fontSize: 12, color: "#b3aea2", alignSelf: "center" }}>
              还有 {queue.length - 1} 笔待支付
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
