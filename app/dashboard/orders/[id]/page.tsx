"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiSend, formatCents, formatDateTime, ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import styles from "../../dashboard.module.css";
import { OrderStatusPill } from "../../page";

type Slot = {
  id: string;
  startAt: string;
  durationMins: number;
  status: "open" | "booked" | "cancelled";
};

type PaymentStatus = "unpaid" | "waiting" | "paid" | "closed" | "refunded";

type Order = {
  id: string;
  parentId: string;
  mentorId: string;
  slotId: string;
  callSessionId: string | null;
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
  paymentStatus: PaymentStatus;
  paymentExpiresAt: string | null;
  paidAt: string | null;
  settledAt: string | null;
  parentReview: { rating: number; text: string | null } | null;
  mentorReview: { rating: number; text: string | null } | null;
  createdAt: string;
};

type Mentor = {
  id: string;
  name: string | null;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  tags: string[] | null;
  ratingAvg: string;
  reviewsCount: number;
};

type Detail = {
  order: Order;
  slot: Slot | null;
  mentor: Mentor | null;
  parent: { id: string; name: string | null } | null;
  callSummary: { transcript: string | null; summary: string | null } | null;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "parent") as
    | "parent"
    | "mentor";
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";

  const reload = async () => {
    setLoading(true);
    try {
      const r = await apiGet<Detail>(`/api/orders/${id}`);
      setDetail(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  if (loading || !detail) {
    return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;
  }

  const { order, slot, mentor, parent, callSummary } = detail;
  const isParent = userId === order.parentId;
  const counterpart = isParent ? mentor : parent;
  const counterpartTitle = isParent ? "学长 / 学姐" : "家长 / 学生";
  const myReview = isParent ? order.parentReview : order.mentorReview;
  const otherReview = isParent ? order.mentorReview : order.parentReview;

  const canStartCall =
    slot &&
    order.paymentStatus === "paid" &&
    (order.status === "scheduled" || order.status === "in_call") &&
    Date.now() >= new Date(slot.startAt).getTime() - 5 * 60 * 1000 &&
    Date.now() <= new Date(slot.startAt).getTime() + slot.durationMins * 60 * 1000 + 10 * 60 * 1000;

  const canCancel = order.status === "scheduled";
  const canReview = (order.status === "completed" || order.status === "reviewed") && !myReview;
  const canPay =
    isParent &&
    order.status === "scheduled" &&
    (order.paymentStatus === "unpaid" || order.paymentStatus === "waiting" || order.paymentStatus === "closed");

  const startCall = async () => {
    setBusy("call");
    try {
      const r = await apiSend<{ sessionId: string }>(`/api/orders/${id}/start-call`, "POST");
      router.push(`/call/${r.sessionId}`);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    if (!confirm("确定要取消这个订单吗？")) return;
    setBusy("cancel");
    try {
      await apiSend(`/api/orders/${id}/cancel`, "POST");
      await reload();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const payNow = () => {
    router.push(`/pay/${id}`);
  };

  const submitReview = async () => {
    setBusy("review");
    try {
      await apiSend(`/api/orders/${id}/review`, "POST", { rating: reviewRating, text: reviewText });
      setReviewText("");
      await reload();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const amount = isParent ? order.priceCents : order.mentorPayoutCents;

  return (
    <>
      <div className={styles.topbar}>
        <Link href="/dashboard/orders" style={{ color: "inherit", textDecoration: "none" }}>
          {isParent ? "我的咨询" : "订单"}
        </Link>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>订单详情</span>
      </div>
      <div className={styles.content}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            {order.topic ? order.topic.slice(0, 60) : "咨询订单"}
          </h1>
          <OrderStatusPill status={order.status} />
        </div>
        <p className={styles.pageSub}>下单于 {formatDateTime(order.createdAt)}</p>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <p className={styles.cardSub}>{counterpartTitle}</p>
            <h3 className={styles.cardTitle}>{counterpart?.name || "—"}</h3>
            {isParent && mentor && (
              <>
                <p style={{ fontSize: 13, color: "#4a4a45", marginTop: 6 }}>
                  {mentor.school || "—"} · {mentor.major || "—"} · {mentor.year || "—"}
                </p>
                {mentor.bio && (
                  <p style={{ fontSize: 13, color: "#6e6e68", marginTop: 10, lineHeight: 1.6 }}>
                    {mentor.bio}
                  </p>
                )}
                {mentor.tags && mentor.tags.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {mentor.tags.map((t) => (
                      <span key={t} className={`${styles.pill} ${styles.pillNeutral}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.card}>
            <p className={styles.cardSub}>通话时间</p>
            <h3 className={styles.cardTitle}>
              {slot ? formatDateTime(slot.startAt) : "—"}
            </h3>
            {slot && <p style={{ fontSize: 13, color: "#4a4a45", marginTop: 6 }}>时长 {slot.durationMins} 分钟</p>}
            <div style={{ borderTop: "1px solid #f0efe9", margin: "14px 0" }} />
            <p className={styles.cardSub}>金额</p>
            <p style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 600, color: accent, marginTop: 4 }}>
              {formatCents(amount)}
            </p>
          </div>
        </div>

        {order.topic && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>咨询主题</h2>
            <div className={styles.card} style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 14, color: "#1f1f1f", lineHeight: 1.7 }}>
              {order.topic}
            </div>
          </div>
        )}

        {callSummary?.summary && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>AI 通话摘要</h2>
            <div
              className={styles.card}
              style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 14, color: "#1f1f1f", lineHeight: 1.8 }}
            >
              {callSummary.summary}
            </div>
            {callSummary.transcript && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  style={{
                    background: "none",
                    border: "none",
                    color: accent,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showTranscript ? "收起转写文本" : "查看完整转写文本"}
                </button>
                {showTranscript && (
                  <div
                    className={styles.card}
                    style={{
                      marginTop: 8,
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                      color: "#4a4a45",
                      lineHeight: 1.8,
                      maxHeight: 400,
                      overflow: "auto",
                    }}
                  >
                    {callSummary.transcript}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isParent && order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && (
          <div
            className={styles.card}
            style={{
              marginTop: 16,
              borderLeft: `3px solid ${accent}`,
              background: "#fff8f5",
            }}
          >
            <p className={styles.cardSub}>支付状态</p>
            <p style={{ fontSize: 14, marginTop: 6, color: "#1f1f1f" }}>
              {order.paymentStatus === "unpaid" && "尚未支付。完成支付后即可在约定时间进入通话。"}
              {order.paymentStatus === "waiting" && "已发起支付，等待支付宝完成扣款。若已付款请稍候片刻或刷新页面。"}
              {order.paymentStatus === "closed" && "上一次支付未完成，已自动关闭。可重新发起支付。"}
            </p>
          </div>
        )}

        <div className={styles.section}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canPay && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: accent }}
                onClick={payNow}
                disabled={busy === "pay"}
              >
                {busy === "pay"
                  ? "跳转中…"
                  : order.paymentStatus === "waiting"
                  ? "继续支付"
                  : `立即支付 ${formatCents(order.priceCents)}`}
              </button>
            )}
            {canStartCall && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: accent }}
                onClick={startCall}
                disabled={busy === "call"}
              >
                {busy === "call" ? "进入中…" : "进入通话"}
              </button>
            )}
            {!canStartCall && order.callSessionId && (order.status === "in_call") && (
              <Link
                href={`/call/${order.callSessionId}`}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: accent }}
              >
                继续通话
              </Link>
            )}
            {canCancel && (
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={cancel}
                disabled={busy === "cancel"}
              >
                {busy === "cancel" ? "取消中…" : "取消订单"}
              </button>
            )}
            {!canStartCall && order.status === "scheduled" && slot && (
              <span style={{ alignSelf: "center", color: "#9a9a93", fontSize: 13 }}>
                通话窗口：{formatDateTime(new Date(new Date(slot.startAt).getTime() - 5 * 60 * 1000).toISOString())} 起
              </span>
            )}
          </div>
        </div>

        {(canReview || myReview || otherReview) && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>评价</h2>
            {myReview && (
              <div className={styles.card} style={{ marginTop: 8 }}>
                <p className={styles.cardSub}>你给出的评价</p>
                <p style={{ marginTop: 6, fontSize: 14 }}>
                  {"★".repeat(myReview.rating)}{"☆".repeat(5 - myReview.rating)}
                </p>
                {myReview.text && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "#4a4a45", whiteSpace: "pre-wrap" }}>
                    {myReview.text}
                  </p>
                )}
              </div>
            )}
            {otherReview && order.status === "reviewed" && (
              <div className={styles.card} style={{ marginTop: 12 }}>
                <p className={styles.cardSub}>{counterpartTitle}的评价</p>
                <p style={{ marginTop: 6, fontSize: 14 }}>
                  {"★".repeat(otherReview.rating)}{"☆".repeat(5 - otherReview.rating)}
                </p>
                {otherReview.text && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "#4a4a45", whiteSpace: "pre-wrap" }}>
                    {otherReview.text}
                  </p>
                )}
              </div>
            )}
            {canReview && (
              <div className={styles.card} style={{ marginTop: 12 }}>
                <div className={styles.field}>
                  <label className={styles.label}>评分</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setReviewRating(n)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 22,
                          color: n <= reviewRating ? accent : "#dedcd2",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>留言（可选）</label>
                  <textarea
                    className={styles.textarea}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="对这次咨询有什么感受？"
                    maxLength={2000}
                  />
                </div>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ background: accent }}
                  onClick={submitReview}
                  disabled={busy === "review"}
                >
                  {busy === "review" ? "提交中…" : "提交评价"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
