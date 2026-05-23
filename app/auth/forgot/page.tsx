"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthClient } from "@/lib/auth-client";
import styles from "../auth.module.css";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") === "mentor" ? "mentor" : "parent";
  const isMentor = role === "mentor";
  const accentColor = isMentor ? "#3d5c4d" : "#b8472d";
  const authClient = getAuthClient(role);

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setLoading(true);
    try {
      const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      if (sendErr) {
        setError(sendErr.message || "发送失败,请重试");
      } else {
        setStep("reset");
        setInfo("验证码已发送,请查收邮件。");
        setCountdown(60);
      }
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      if (sendErr) {
        setError(sendErr.message || "发送失败,请重试");
      } else {
        setInfo("验证码已重新发送。");
        setCountdown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("请输入完整的 6 位验证码");
      return;
    }
    if (password.length < 8) {
      setError("新密码至少 8 个字符");
      return;
    }
    setLoading(true);
    try {
      const { error: resetErr } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });
      if (resetErr) {
        setError(resetErr.message || "重置失败,请检查验证码是否正确");
      } else {
        setInfo("密码已重置,正在跳转登录...");
        setTimeout(() => {
          router.replace(`/auth?role=${role}&mode=login`);
        }, 1200);
      }
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href={`/auth?role=${role}&mode=login`} className={styles.backLink}>
          ← 返回登录
        </Link>

        <div className={styles.roleTag} style={{ color: accentColor }}>
          {isMentor ? "指路人" : "家长 / 学生"}
        </div>

        <h1 className={styles.title} style={{ color: accentColor }}>
          忘记密码
        </h1>
        <p className={styles.subtitle}>
          {step === "email"
            ? "输入注册邮箱,我们会发送一个验证码用于重置密码。"
            : `验证码已发送到 ${email}。请输入验证码并设置新密码。`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendOtp} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>邮箱</label>
              <input
                type="email"
                className={styles.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: accentColor, borderColor: accentColor }}
              disabled={loading}
            >
              {loading ? "发送中..." : "发送验证码"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>验证码</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className={styles.input}
                placeholder="6 位数字"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                style={{ letterSpacing: "0.3em", fontFamily: "var(--serif)" }}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>新密码</label>
              <input
                type="password"
                className={styles.input}
                placeholder="至少 8 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {info && !error && (
              <p style={{ fontSize: 13, color: "#4a4a45", margin: 0 }}>{info}</p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: accentColor, borderColor: accentColor }}
              disabled={loading}
            >
              {loading ? "处理中..." : "重置密码"}
            </button>

            <div className={styles.switchMode}>
              没收到?{" "}
              <button
                type="button"
                className={styles.switchBtn}
                style={{ color: accentColor, opacity: countdown > 0 ? 0.5 : 1 }}
                onClick={resendOtp}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `${countdown}s 后可重发` : "重新发送验证码"}
              </button>
            </div>
          </form>
        )}

        <div className={styles.switchRole}>
          {isMentor ? (
            <Link href="/auth/forgot?role=parent">我是家长 / 学生 →</Link>
          ) : (
            <Link href="/auth/forgot?role=mentor">我是学长 / 学姐 →</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
