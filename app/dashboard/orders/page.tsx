"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, formatCents, formatDateTime } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import styles from "../dashboard.module.css";
import { OrderStatusPill } from "../page";

type Order = {
  id: string;
  parentId: string;
  mentorId: string;
  slotId: string;
  status:
    | "scheduled"
    | "in_call"
    | "completed"
    | "cancelled_by_parent"
    | "cancelled_by_mentor"
    | "reviewed";
  topic: string | null;
  priceCents?: number;
  mentorPayoutCents?: number;
  paidAt: string | null;
  createdAt: string;
};

export default function OrdersListPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "parent") as
    | "parent"
    | "mentor";

  useEffect(() => {
    if (!session) return;
    apiGet<{ orders: Order[] }>("/api/orders")
      .then((r) => setOrders(r.orders))
      .finally(() => setLoading(false));
  }, [session]);

  const title = role === "mentor" ? "订单" : "我的咨询";
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";

  return (
    <>
      <div className={styles.topbar}>
        <span>{role === "mentor" ? "指路" : "问津"}</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>{title}</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSub}>
          {role === "mentor"
            ? "查看所有咨询订单，点击进入详情可发起通话或完成评价。"
            : "查看你下过的咨询订单，点击进入详情可发起通话或评价。"}
        </p>

        {loading ? (
          <div className={styles.emptyState}>加载中…</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            {role === "mentor" ? "暂无订单。开放档期后，家长就能预订咨询。" : "暂无咨询订单。"}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>主题</th>
                <th>状态</th>
                <th>金额</th>
                <th>下单时间</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const amount = role === "mentor" ? o.mentorPayoutCents : o.priceCents;
                return (
                  <tr key={o.id}>
                    <td style={{ maxWidth: 280 }}>
                      {o.topic ? o.topic.slice(0, 40) : <span style={{ color: "#9a9a93" }}>未填写主题</span>}
                    </td>
                    <td>
                      <OrderStatusPill status={o.status} />
                    </td>
                    <td style={{ fontFamily: "var(--serif)", fontWeight: 500 }}>
                      {formatCents(amount)}
                    </td>
                    <td style={{ color: "#6e6e68" }}>{formatDateTime(o.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ color: accent }}
                      >
                        查看 →
                      </Link>
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
