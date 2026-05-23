"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiSend, formatCents, formatDateTime, ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import styles from "../dashboard.module.css";

type Earnings = {
  settledCents: number;
  pendingCents: number;
  thisMonthSettledCents: number;
  creditCents: number;
  withdrawnPendingCents: number;
  withdrawnPaidCents: number;
  availableCents: number;
  hasAlipayQr: boolean;
};

type Withdrawal = {
  id: string;
  amountCents: number;
  status: "pending" | "paid" | "rejected";
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
};

const accent = "#3d5c4d";

export default function WalletPage() {
  const { data: session, isPending } = useSession();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [minCents, setMinCents] = useState(5000);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingQr, setSavingQr] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [amountYuan, setAmountYuan] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const me = await apiGet<{ mentorProfile: { alipayQrImageUrl: string | null } | null }>(
        "/api/me/profile"
      );
      setQrImage(me.mentorProfile?.alipayQrImageUrl ?? null);
      const e = await apiGet<Earnings>("/api/mentors/me/earnings");
      setEarnings(e);
      const w = await apiGet<{ withdrawals: Withdrawal[]; withdrawMinCents: number }>(
        "/api/mentors/me/withdrawals"
      );
      setWithdrawals(w.withdrawals);
      setMinCents(w.withdrawMinCents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && session) void reload();
  }, [isPending, session]);

  const handleFile = (file: File) => {
    setQrErr(null);
    if (file.size > 2 * 1024 * 1024) {
      setQrErr("图片过大,请压缩到 2 MB 以内");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      setSavingQr(true);
      try {
        await apiSend("/api/mentors/me/profile", "PATCH", { alipayQrImageUrl: dataUrl });
        setQrImage(dataUrl);
        await reload();
      } catch (e) {
        setQrErr(e instanceof ApiError ? e.message : (e as Error).message);
      } finally {
        setSavingQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const openDialog = () => {
    if (!earnings) return;
    if (!earnings.hasAlipayQr) {
      alert("请先上传支付宝收款码");
      return;
    }
    setAmountYuan(((earnings.availableCents) / 100).toFixed(2));
    setSubmitErr(null);
    setShowDialog(true);
  };

  const submitWithdrawal = async () => {
    setSubmitErr(null);
    const amount = Math.round(Number(amountYuan) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitErr("请输入合法金额");
      return;
    }
    setSubmitting(true);
    try {
      await apiSend("/api/mentors/me/withdrawals", "POST", { amountCents: amount });
      setShowDialog(false);
      setAmountYuan("");
      await reload();
    } catch (e) {
      setSubmitErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || loading || !earnings) {
    return <div className={styles.content}>加载中…</div>;
  }

  const canWithdraw = earnings.hasAlipayQr && earnings.availableCents >= minCents;

  return (
    <>
      <div className={styles.topbar}>
        <span>指路</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>钱包</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>钱包</h1>
        <p className={styles.pageSub}>查看可提现余额,管理支付宝收款码,发起提现申请。</p>

        <div className={styles.grid3}>
          <div className={styles.card}>
            <p className={styles.cardSub}>可提现</p>
            <p className={styles.statValue} style={{ color: accent }}>
              {formatCents(earnings.availableCents)}
            </p>
            <p className={styles.cardSub} style={{ marginTop: 8 }}>
              已结算 {formatCents(earnings.settledCents)}
              {earnings.creditCents > 0 && ` · 补偿 ${formatCents(earnings.creditCents)}`}
            </p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardSub}>待结算</p>
            <p className={styles.statValue}>{formatCents(earnings.pendingCents)}</p>
            <p className={styles.cardSub} style={{ marginTop: 8 }}>
              未完成的订单
            </p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardSub}>已提现</p>
            <p className={styles.statValue}>{formatCents(earnings.withdrawnPaidCents)}</p>
            <p className={styles.cardSub} style={{ marginTop: 8 }}>
              处理中 {formatCents(earnings.withdrawnPendingCents)}
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>支付宝收款码</h2>
          </div>
          <div className={styles.card}>
            {qrImage ? (
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImage}
                  alt="支付宝收款码"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: "contain",
                    border: "1px solid #ececec",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#1f1f1f" }}>
                    已上传。提现申请会附带当前收款码,admin 审核打款时使用。
                  </p>
                  <p className={styles.cardSub} style={{ marginTop: 6 }}>
                    换号后重新上传即可,旧的提现单仍用申请那一刻的收款码。
                  </p>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    style={{ marginTop: 12 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingQr}
                  >
                    {savingQr ? "上传中…" : "重新上传"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: 0, fontSize: 14, color: "#1f1f1f" }}>
                  先上传支付宝收款码,之后才能发起提现申请。
                </p>
                <p className={styles.cardSub} style={{ marginTop: 6 }}>
                  支付宝 → 我的 → 收钱 → 长按保存收款码图片,JPG / PNG ≤ 2 MB。
                </p>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ background: accent, marginTop: 12 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingQr}
                >
                  {savingQr ? "上传中…" : "上传收款码"}
                </button>
              </div>
            )}
            {qrErr && (
              <div className={styles.alertBad} style={{ marginTop: 12 }}>
                {qrErr}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>提现</h2>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: accent, opacity: canWithdraw ? 1 : 0.5 }}
              onClick={openDialog}
              disabled={!canWithdraw}
            >
              申请提现
            </button>
          </div>
          <p className={styles.cardSub} style={{ margin: "-4px 0 12px" }}>
            余额满 {(minCents / 100).toFixed(0)} 元起可提现。
          </p>
          {!earnings.hasAlipayQr ? (
            <div className={styles.alertWarn}>
              <span>⏰</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>未上传收款码</div>
                <div>先上传支付宝收款码,才能发起提现。</div>
              </div>
            </div>
          ) : earnings.availableCents < minCents ? (
            <div className={styles.alertWarn}>
              <span>💰</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>余额未达到提现门槛</div>
                <div>
                  单笔最低 {(minCents / 100).toFixed(0)} 元,当前可提{" "}
                  {formatCents(earnings.availableCents)}。
                </div>
              </div>
            </div>
          ) : null}

          {withdrawals.length === 0 ? (
            <div className={styles.emptyState} style={{ marginTop: 16 }}>
              暂无提现记录。
            </div>
          ) : (
            <table className={styles.table} style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>处理时间</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>{formatDateTime(w.createdAt)}</td>
                    <td>{formatCents(w.amountCents)}</td>
                    <td>
                      <WithdrawalStatusPill status={w.status} />
                    </td>
                    <td>{w.processedAt ? formatDateTime(w.processedAt) : "—"}</td>
                    <td style={{ color: "#6e6e68" }}>{w.adminNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => !submitting && setShowDialog(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: 24,
              maxWidth: 380,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>申请提现</h3>
            <p className={styles.cardSub}>
              单笔最低 {(minCents / 100).toFixed(0)} 元,最多 {formatCents(earnings.availableCents)}。
              提现后由 admin 手工扫码转账,通常 1 ~ 2 个工作日。
            </p>
            <label className={styles.label} style={{ marginTop: 16 }}>
              金额(元)
            </label>
            <input
              className={styles.input}
              type="number"
              min={minCents / 100}
              max={earnings.availableCents / 100}
              step="0.01"
              value={amountYuan}
              onChange={(e) => setAmountYuan(e.target.value)}
              disabled={submitting}
            />
            {submitErr && (
              <div className={styles.alertBad} style={{ marginTop: 10 }}>
                {submitErr}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: accent }}
                onClick={submitWithdrawal}
                disabled={submitting}
              >
                {submitting ? "提交中…" : "确认提交"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WithdrawalStatusPill({ status }: { status: "pending" | "paid" | "rejected" }) {
  const map: Record<typeof status, { label: string; cls: string }> = {
    pending: { label: "处理中", cls: styles.pillWarn },
    paid: { label: "已打款", cls: styles.pillOk },
    rejected: { label: "已拒绝", cls: styles.pillBad },
  };
  const m = map[status];
  return <span className={`${styles.pill} ${m.cls}`}>{m.label}</span>;
}
