"use client";

import { useEffect, useState } from "react";
import { apiGet, formatCents, formatDateTime, ApiError } from "@/lib/api";
import styles from "../../dashboard/dashboard.module.css";

type OrderStatus =
  | "scheduled"
  | "in_call"
  | "completed"
  | "cancelled_by_parent"
  | "cancelled_by_mentor"
  | "reviewed";

type PaymentStatus = "unpaid" | "waiting" | "paid" | "closed" | "refunded";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  topic: string | null;
  priceCents: number;
  mentorPayoutCents: number;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  settledAt: string | null;
  createdAt: string;
  parentId: string;
  mentorId: string;
  parentName: string;
  parentEmail: string;
  mentorName: string;
  mentorEmail: string;
  mentorSchool: string | null;
  mentorMajor: string | null;
  slotStartAt: string | null;
};

const STATUS_LABEL: Record<OrderStatus, { label: string; cls: string }> = {
  scheduled: { label: "待开始", cls: "pillNeutral" },
  in_call: { label: "通话中", cls: "pillWarn" },
  completed: { label: "已通话", cls: "pillOk" },
  reviewed: { label: "已完成", cls: "pillOk" },
  cancelled_by_parent: { label: "家长取消", cls: "pillBad" },
  cancelled_by_mentor: { label: "学长学姐取消", cls: "pillBad" },
};

const PAY_LABEL: Record<PaymentStatus, { label: string; cls: string }> = {
  unpaid: { label: "未支付", cls: "pillNeutral" },
  waiting: { label: "等待支付", cls: "pillWarn" },
  paid: { label: "已支付", cls: "pillOk" },
  closed: { label: "已关闭", cls: "pillBad" },
  refunded: { label: "已退款", cls: "pillBad" },
};

type Filter = "all" | OrderStatus;

function buildNotifyText(o: AdminOrder): string {
  const name = o.mentorName || "学长/学姐";
  const time = o.slotStartAt ? formatDateTime(o.slotStartAt) : "待确认";
  return `${name}你好，恭喜你接到一条来自高中生家庭，在${time}的咨询订单，麻烦尽快登录网站确认哦！入口 https://mentor.wenjin-zhilu.com/`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await apiGet<{ orders: AdminOrder[] }>("/api/admin/orders/list");
        if (!cancel) setOrders(r.orders);
      } catch (e) {
        if (!cancel) setErr(e instanceof ApiError ? e.message : (e as Error).message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = orders
    ? orders.filter((o) => {
        if (filter !== "all" && o.status !== filter) return false;
        if (!q.trim()) return true;
        const s = q.trim().toLowerCase();
        return (
          o.parentName?.toLowerCase().includes(s) ||
          o.parentEmail?.toLowerCase().includes(s) ||
          o.mentorName?.toLowerCase().includes(s) ||
          o.mentorEmail?.toLowerCase().includes(s) ||
          o.topic?.toLowerCase().includes(s) ||
          o.id.toLowerCase().includes(s)
        );
      })
    : null;

  const stats = orders
    ? {
        total: orders.length,
        paid: orders.filter((o) => o.paymentStatus === "paid").length,
        revenueCents: orders
          .filter((o) => o.paymentStatus === "paid")
          .reduce((s, o) => s + o.priceCents, 0),
      }
    : null;

  return (
    <>
      <div className={styles.topbar}>
        <span>后台</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>订单</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>所有订单</h1>
        <p className={styles.pageSub}>
          {orders === null ? "加载中…" : `共 ${orders.length} 单`}
        </p>

        {err && (
          <div className={styles.alertBad} style={{ marginBottom: 16 }}>
            {err}
          </div>
        )}

        {stats && (
          <div className={styles.grid3} style={{ marginBottom: 20 }}>
            <div className={styles.card}>
              <p className={styles.cardSub}>总订单</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardSub}>已支付</p>
              <p className={styles.statValue}>{stats.paid}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardSub}>总收入</p>
              <p className={styles.statValue}>{formatCents(stats.revenueCents)}</p>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className={styles.select}
            style={{ maxWidth: 180 }}
          >
            <option value="all">全部状态</option>
            <option value="scheduled">待开始</option>
            <option value="in_call">通话中</option>
            <option value="completed">已通话</option>
            <option value="reviewed">已完成</option>
            <option value="cancelled_by_parent">家长取消</option>
            <option value="cancelled_by_mentor">学长学姐取消</option>
          </select>
          <input
            type="search"
            placeholder="搜索家长 / 学长学姐 / 主题…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 280 }}
          />
        </div>

        {orders === null ? (
          <div className={styles.emptyState}>加载中…</div>
        ) : filtered && filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {orders.length === 0 ? "暂无订单。" : "没有匹配的订单。"}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>家长</th>
                <th>学长学姐</th>
                <th>主题</th>
                <th>状态</th>
                <th>支付</th>
                <th>金额</th>
                <th>下单时间</th>
                <th>通知</th>
              </tr>
            </thead>
            <tbody>
              {filtered!.map((o) => {
                const st = STATUS_LABEL[o.status];
                const ps = PAY_LABEL[o.paymentStatus];
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.parentName || "—"}</div>
                      <div style={{ fontSize: 12, color: "#9a9a93", marginTop: 2 }}>
                        {o.parentEmail}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.mentorName || "—"}</div>
                      <div style={{ fontSize: 12, color: "#9a9a93", marginTop: 2 }}>
                        {o.mentorSchool || "—"} · {o.mentorMajor || "—"}
                      </div>
                    </td>
                    <td style={{ maxWidth: 240 }}>
                      {o.topic ? (
                        o.topic.slice(0, 40)
                      ) : (
                        <span style={{ color: "#9a9a93" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.pill} ${styles[st.cls as keyof typeof styles]}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.pill} ${styles[ps.cls as keyof typeof styles]}`}
                      >
                        {ps.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--serif)", fontWeight: 500 }}>
                      {formatCents(o.priceCents)}
                    </td>
                    <td style={{ color: "#6e6e68" }}>
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(buildNotifyText(o));
                          setCopiedId(o.id);
                          setTimeout(() => setCopiedId((prev) => prev === o.id ? null : prev), 2000);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          border: "1px solid #d4d4cd",
                          borderRadius: 5,
                          background: copiedId === o.id ? "#3d5c4d" : "#fff",
                          color: copiedId === o.id ? "#fff" : "#4a4a45",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s",
                        }}
                        title={buildNotifyText(o)}
                      >
                        {copiedId === o.id ? "已复制" : "复制通知"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
