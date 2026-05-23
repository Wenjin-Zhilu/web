"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { apiGet, apiSend, formatCents, ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type PaymentStatus = "unpaid" | "waiting" | "paid" | "closed" | "refunded";

type OrderDetail = {
  order: {
    id: string;
    parentId: string;
    priceCents?: number;
    topic: string | null;
    paymentStatus: PaymentStatus;
    paymentExpiresAt: string | null;
  };
  mentor: { name: string | null; school: string | null; major: string | null } | null;
  slot: { startAt: string; durationMins: number } | null;
};

export default function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("unpaid");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // Step 1: 拿订单详情
  useEffect(() => {
    if (!session) return;
    apiGet<OrderDetail>(`/api/orders/${orderId}`)
      .then((d) => {
        setDetail(d);
        setStatus(d.order.paymentStatus);
        if (d.order.paymentStatus === "paid") {
          router.replace(`/dashboard/orders/${orderId}`);
        }
      })
      .catch((e) => setErrMsg(e instanceof ApiError ? e.message : (e as Error).message));
  }, [session, orderId, router]);

  // Step 2: 拉 QR
  useEffect(() => {
    if (!detail) return;
    if (detail.order.paymentStatus === "paid") return;
    setGenerating(true);
    apiSend<{ qrCode: string; expiresAt: string }>(`/api/payments/alipay/checkout`, "POST", {
      orderId,
    })
      .then(async (r) => {
        setQrText(r.qrCode);
        setExpiresAt(r.expiresAt);
        const dataUrl = await QRCode.toDataURL(r.qrCode, {
          width: 280,
          margin: 1,
          color: { dark: "#1f1f1f", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
        setStatus("waiting");
      })
      .catch((e) => setErrMsg(e instanceof ApiError ? e.message : (e as Error).message))
      .finally(() => setGenerating(false));
  }, [detail, orderId]);

  // Step 3: 轮询状态
  useEffect(() => {
    if (status !== "waiting") return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const r = await apiGet<{ paymentStatus: PaymentStatus }>(`/api/payments/alipay/status/${orderId}`);
        if (cancelled) return;
        setStatus(r.paymentStatus);
        if (r.paymentStatus === "paid") {
          setTimeout(() => router.replace(`/dashboard/orders/${orderId}`), 1500);
          return;
        }
        if (r.paymentStatus === "waiting") {
          pollTimer.current = setTimeout(tick, 2000);
        }
      } catch {
        if (!cancelled) pollTimer.current = setTimeout(tick, 3000);
      }
    };
    pollTimer.current = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [status, orderId, router]);

  if (errMsg) {
    return (
      <Page>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>出错了</h1>
        <p style={{ marginTop: 10, color: "#a14747" }}>{errMsg}</p>
        <Link href="/dashboard" style={btnStyle}>回到首页</Link>
      </Page>
    );
  }

  if (!detail || generating) {
    return <Page><p style={{ color: "#6e6e68" }}>正在生成支付二维码…</p></Page>;
  }

  if (status === "paid") {
    return (
      <Page>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: "#3d5c4d", marginBottom: 18 }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>支付成功 🎉</h1>
        <p style={{ marginTop: 10, color: "#6e6e68" }}>正在跳到订单详情…</p>
      </Page>
    );
  }

  const m = detail.mentor;
  const slot = detail.slot;

  return (
    <Page>
      <p style={{ fontSize: 12, color: "#9a9a93", letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
        问津 · 支付
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 16px" }}>用支付宝扫码付款</h1>

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ background: "#fff", padding: 16, border: "1px solid #ece9df", borderRadius: 8 }}>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="支付二维码" width={280} height={280} style={{ display: "block" }} />
          ) : (
            <div style={{ width: 280, height: 280, background: "#f0efe9" }} />
          )}
          <p style={{ marginTop: 14, fontSize: 12, color: "#6e6e68", textAlign: "center" }}>
            打开支付宝 → 扫一扫
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <Row label="金额" value={<strong style={{ fontFamily: "var(--serif)", fontSize: 28, color: "#b8472d" }}>{formatCents(detail.order.priceCents)}</strong>} />
          {m && <Row label="学长 / 学姐" value={`${m.name || "—"}　${m.school || ""} · ${m.major || ""}`} />}
          {slot && (
            <Row
              label="通话时间"
              value={`${new Date(slot.startAt).toLocaleString("zh-CN", { hour12: false }).slice(0, 16)} · ${slot.durationMins} 分钟`}
            />
          )}
          {detail.order.topic && <Row label="主题" value={detail.order.topic.slice(0, 60)} />}
          {expiresAt && (
            <p style={{ marginTop: 16, fontSize: 12, color: "#9a9a93" }}>
              二维码 {new Date(expiresAt).toLocaleTimeString("zh-CN", { hour12: false }).slice(0, 5)} 失效，过期后可重新生成。
            </p>
          )}
          <p style={{ marginTop: 8, fontSize: 12, color: "#9a9a93" }}>
            支付成功后会自动跳到订单详情。
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
            <Link href={`/dashboard/orders/${orderId}`} style={btnGhostStyle}>稍后再付</Link>
            {qrText && (
              <a href={qrText} target="_blank" rel="noreferrer" style={btnGhostStyle}>在新窗口打开 QR</a>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1f1f1f" }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px dashed #ece9df" }}>
      <div style={{ fontSize: 12, color: "#9a9a93", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 14 }}>{value}</div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  background: "#b8472d",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 6,
  fontSize: 14,
  marginTop: 18,
};

const btnGhostStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  border: "1px solid #ddd9cf",
  color: "#1f1f1f",
  textDecoration: "none",
  borderRadius: 6,
  fontSize: 13,
};
