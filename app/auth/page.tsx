"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthClient } from "@/lib/auth-client";
import { Suspense } from "react";
import styles from "./auth.module.css";


function getSafeLocalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") === "mentor" ? "mentor" : "parent";
  const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
  const redirect = getSafeLocalRedirect(searchParams.get("redirect"));
  const ref = searchParams.get("ref");
  const redirectQuery = encodeURIComponent(redirect);
  const isMentor = role === "mentor";
  const authClient = getAuthClient(role);

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [authMethod, setAuthMethod] = useState<"phone" | "email">(isMentor ? "email" : "phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accentColor = isMentor ? "#3d5c4d" : "#b8472d";

  const validateEmail = () => {
    if (!email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return false;
    }
    return true;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入有效的 11 位手机号");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 个字符");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/phone/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "发送失败");
          return;
        }
        sessionStorage.setItem("verify_phone", phone);
        sessionStorage.setItem("verify_phone_pwd", password);
        sessionStorage.setItem("auth_redirect", redirect);
        sessionStorage.setItem("auth_role", role);
        if (ref) sessionStorage.setItem("auth_ref", ref);
        router.replace("/auth/verify");
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: `${phone}@phone.local`,
          password,
        });
        if (signInError) {
          setError(signInError.message === "Invalid email or password"
            ? "手机号或密码错误"
            : signInError.message || "登录失败");
        } else {
          router.replace(redirect);
        }
      }
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail()) return;
    if (password.length < 8) {
      setError("密码至少 8 个字符");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
          callbackURL: redirect,
          ...({ role } as Record<string, string>),
        });
        if (signUpError) {
          if (signUpError.code === "USER_ALREADY_EXISTS") {
            await authClient.emailOtp.sendVerificationOtp({
              email,
              type: "email-verification",
            });
            sessionStorage.setItem("verify_email", email);
            sessionStorage.setItem("auth_redirect", redirect);
            sessionStorage.setItem("auth_role", role);
            if (ref) sessionStorage.setItem("auth_ref", ref);
            router.replace("/auth/verify");
            return;
          }
          setError(signUpError.message || "注册失败,请重试");
        } else {
          sessionStorage.setItem("verify_email", email);
          sessionStorage.setItem("auth_redirect", redirect);
          sessionStorage.setItem("auth_role", role);
          if (ref) sessionStorage.setItem("auth_ref", ref);
          router.replace("/auth/verify");
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirect,
        });
        if (signInError) {
          if (signInError.message?.includes("verified") || signInError.code === "EMAIL_NOT_VERIFIED") {
            await authClient.emailOtp.sendVerificationOtp({
              email,
              type: "email-verification",
            });
            sessionStorage.setItem("verify_email", email);
            sessionStorage.setItem("auth_redirect", redirect);
            sessionStorage.setItem("auth_role", role);
            if (ref) sessionStorage.setItem("auth_ref", ref);
            router.replace("/auth/verify");
          } else {
            setError(signInError.message || "登录失败,请检查邮箱和密码");
          }
        } else {
          router.replace(redirect);
        }
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
        <Link href="/" className={styles.backLink}>
          ← 返回首页
        </Link>

        <div className={styles.roleTag} style={{ color: accentColor }}>
          {isMentor ? "指路人" : "家长 / 学生"}
        </div>

        <h1 className={styles.title} style={{ color: accentColor }}>
          {mode === "register" ? "注册" : "登录"}
        </h1>
        <p className={styles.subtitle}>
          {isMentor
            ? "注册成为指路人（推荐使用高校邮箱）"
            : "开始问津,找到你需要的学长学姐"}
        </p>

        {!isMentor && (
          <div className={styles.methodToggle}>
            <button
              className={`${styles.methodBtn} ${authMethod === "phone" ? styles.methodActive : ""}`}
              style={authMethod === "phone" ? { color: accentColor } : undefined}
              onClick={() => { setAuthMethod("phone"); setError(""); }}
            >
              手机号
            </button>
            <button
              className={`${styles.methodBtn} ${authMethod === "email" ? styles.methodActive : ""}`}
              style={authMethod === "email" ? { color: accentColor } : undefined}
              onClick={() => { setAuthMethod("email"); setError(""); }}
            >
              邮箱
            </button>
          </div>
        )}

        {authMethod === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>手机号</label>
              <input
                type="tel"
                className={styles.input}
                placeholder="请输入 11 位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                required
                style={{ borderColor: error ? "#dc2626" : undefined }}
              />
            </div>
            <div className={styles.field}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label className={styles.label}>密码</label>
              </div>
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

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: accentColor, borderColor: accentColor }}
              disabled={loading}
            >
              {loading
                ? "处理中..."
                : mode === "register"
                  ? "获取验证码"
                  : "登录"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>邮箱</label>
              <input
                type="email"
                className={styles.input}
                placeholder={
                  isMentor
                    ? "推荐使用 .edu 邮箱"
                    : "your@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderColor: error ? "#dc2626" : undefined }}
              />
            </div>
            <div className={styles.field}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label className={styles.label}>密码</label>
                {mode === "login" && (
                  <Link
                    href={`/auth/forgot?role=${role}`}
                    style={{
                      fontSize: 12,
                      color: accentColor,
                      textDecoration: "none",
                    }}
                  >
                    忘记密码?
                  </Link>
                )}
              </div>
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

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: accentColor, borderColor: accentColor }}
              disabled={loading}
            >
              {loading
                ? "处理中..."
                : mode === "register"
                  ? "注册"
                  : "登录"}
            </button>
          </form>
        )}

        <div className={styles.switchMode}>
          {mode === "register" ? (
            <span>
              已有账号?{" "}
              <button
                className={styles.switchBtn}
                style={{ color: accentColor }}
                onClick={() => { setMode("login"); setError(""); }}
              >
                去登录
              </button>
            </span>
          ) : (
            <span>
              没有账号?{" "}
              <button
                className={styles.switchBtn}
                style={{ color: accentColor }}
                onClick={() => { setMode("register"); setError(""); }}
              >
                去注册
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
