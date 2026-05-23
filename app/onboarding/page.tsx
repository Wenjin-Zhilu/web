// web/app/onboarding/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { defaultIntroCard, mergeIntroCard, type IntroCard } from "@/lib/intro-card-schema";
import dashboardStyles from "../dashboard/dashboard.module.css";
import styles from "./onboarding.module.css";
import { ProgressBar } from "./components/ProgressBar";
import { Step1Basic, validateStep1, type Step1Data } from "./steps/Step1Basic";
import { Step2SchoolEval, validateStep2 } from "./steps/Step2SchoolEval";
import { Step3PersonalExp, validateStep3 } from "./steps/Step3PersonalExp";
import { Step4Proof, validateStep4, type Step4Data } from "./steps/Step4Proof";

type MentorProfile = {
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  highSchool: string | null;
  bio: string | null;
  tags: string[] | null;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  introCard: unknown;
  proofImageUrl: string | null;
};

const accent = "#3d5c4d";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState<Step1Data>({
    school: "",
    college: "",
    major: "",
    year: "",
    highSchool: "",
    displayInitial: "",
    displayTitle: "",
    bio: "",
    tags: [],
  });
  const [intro, setIntro] = useState<IntroCard>(defaultIntroCard());
  const [proof, setProof] = useState<Step4Data>({ proofDataUrl: null, proofExistingUrl: null });
  const [fileError, setFileError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    s1: Partial<Record<keyof Step1Data, string>>;
    s2: Record<string, string>;
    s3: Record<string, string>;
    s4: string | null;
  }>({ s1: {}, s2: {}, s3: {}, s4: null });

  const [saving, setSaving] = useState<"draft" | "next" | "submit" | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const sessionUserId = session?.user?.id;
  const sessionUserRole = (session?.user as { role?: string } | undefined)?.role;
  const sessionUserName = session?.user?.name || "";

  useEffect(() => {
    if (isPending) return;
    if (!sessionUserId) {
      router.replace("/auth?mode=login");
      return;
    }
    if (sessionUserRole !== "mentor") {
      router.replace("/dashboard");
      return;
    }
    if (loadedUserIdRef.current === sessionUserId) return;
    loadedUserIdRef.current = sessionUserId;
    apiGet<{ mentorProfile: MentorProfile | null }>("/api/me/profile").then((r) => {
      const p = r.mentorProfile;
      setProfile(p);
      if (p) {
        const merged = mergeIntroCard(p.introCard);
        setIntro(merged);
        setBasic({
          school: p.school || "",
          college: p.college || "",
          major: p.major || "",
          year: p.year || "",
          highSchool: p.highSchool || "",
          displayInitial:
            merged.displayInitial ||
            (sessionUserName.trim().charAt(0)) ||
            "",
          displayTitle: merged.displayTitle || "",
          bio: p.bio || "",
          tags: p.tags || [],
        });
        setProof({ proofDataUrl: null, proofExistingUrl: p.proofImageUrl || null });
        setStep(Math.max(0, Math.min(3, merged._lastStep ?? 0)));
      }
      setLoaded(true);
    });
  }, [sessionUserId, sessionUserRole, sessionUserName, isPending, router]);

  if (isPending || !loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6e6e68",
        }}
      >
        加载中…
      </div>
    );
  }

  if (profile && (profile.reviewStatus === "approved" || profile.reviewStatus === "pending")) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", padding: "60px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, color: "#1f1f1f", margin: 0 }}>
            {profile.reviewStatus === "approved" ? "你已通过审核" : "资料已提交，审核中"}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6e6e68" }}>
            前往后台查看订单 / 开放档期 / 修改资料。
          </p>
          <Link
            href="/dashboard"
            className={`${dashboardStyles.btn} ${dashboardStyles.btnPrimary}`}
            style={{ background: accent, marginTop: 20 }}
          >
            进入后台
          </Link>
        </div>
      </div>
    );
  }

  const buildBody = (lastStep: number) => {
    const body: Record<string, unknown> = {
      school: basic.school,
      college: basic.college,
      major: basic.major,
      year: basic.year,
      highSchool: basic.highSchool,
      bio: basic.bio,
      tags: basic.tags,
      introCard: {
        ...intro,
        _lastStep: lastStep,
        displayInitial: basic.displayInitial,
        displayTitle: basic.displayTitle,
      },
    };
    if (proof.proofDataUrl) body.proofImageUrl = proof.proofDataUrl;
    return body;
  };

  const persist = async (lastStep: number) => {
    await apiSend("/api/mentors/me/profile", "PATCH", buildBody(lastStep));
  };

  const onSaveDraft = async () => {
    setSaving("draft");
    setMsg(null);
    try {
      await persist(step);
      setMsg({ kind: "ok", text: "草稿已保存" });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const validateCurrent = (): boolean => {
    if (step === 0) {
      const e = validateStep1(basic);
      setErrors((p) => ({ ...p, s1: e }));
      return Object.keys(e).length === 0;
    }
    if (step === 1) {
      const e = validateStep2(intro.schoolEval);
      setErrors((p) => ({ ...p, s2: e }));
      return Object.keys(e).length === 0;
    }
    if (step === 2) {
      const e = validateStep3(intro.personalExp);
      setErrors((p) => ({ ...p, s3: e }));
      return Object.keys(e).length === 0;
    }
    return true;
  };

  const onNext = async () => {
    if (!validateCurrent()) {
      setMsg({ kind: "err", text: "请先修正本步骤的必填项" });
      return;
    }
    setMsg(null);
    setSaving("next");
    try {
      const next = step + 1;
      await persist(next);
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const onBack = async () => {
    const prev = Math.max(0, step - 1);
    setSaving("draft");
    try {
      await persist(prev);
      setStep(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const onSubmit = async () => {
    // 跑前 3 步完整校验
    const e1 = validateStep1(basic);
    const e2 = validateStep2(intro.schoolEval);
    const e3 = validateStep3(intro.personalExp);
    const e4 = validateStep4(proof, fileError);
    setErrors({ s1: e1, s2: e2, s3: e3, s4: e4 });

    if (Object.keys(e1).length) {
      setStep(0);
      setMsg({ kind: "err", text: "基本信息有未填项" });
      return;
    }
    if (Object.keys(e2).length) {
      setStep(1);
      setMsg({ kind: "err", text: "学院介绍有未填项" });
      return;
    }
    if (Object.keys(e3).length) {
      setStep(2);
      setMsg({ kind: "err", text: "差异化经历有未填项" });
      return;
    }
    if (e4) {
      setMsg({ kind: "err", text: e4 });
      return;
    }

    setSaving("submit");
    setMsg(null);
    try {
      await persist(3);
      await apiSend("/api/mentors/me/profile/submit", "POST");
      router.push("/dashboard");
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
      setSaving(null);
    }
  };

  const handleProofChange = (dataUrl: string | null) => {
    if (dataUrl === null) {
      setFileError("图片过大，请压缩到 2 MB 以内");
      return;
    }
    setFileError(null);
    setProof((p) => ({ ...p, proofDataUrl: dataUrl }));
  };

  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>路</div>
            <div>
              <div className={styles.brandName}>指路</div>
              <div className={styles.brandSub}>学长 / 学姐入驻</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.draftBtn}
            onClick={onSaveDraft}
            disabled={saving !== null}
          >
            {saving === "draft" ? "保存中…" : "保存草稿"}
          </button>
        </div>

        <ProgressBar current={step} />

        {profile?.reviewStatus === "rejected" && (
          <div className={styles.alertBad}>
            上次审核未通过，请按管理员反馈修改后重新提交。
          </div>
        )}

        {msg && (
          <div className={msg.kind === "ok" ? styles.alertOk : styles.alertBad}>{msg.text}</div>
        )}

        {step === 0 && (
          <Step1Basic
            data={basic}
            errors={errors.s1}
            onChange={(patch) => setBasic((p) => ({ ...p, ...patch }))}
          />
        )}
        {step === 1 && (
          <Step2SchoolEval
            data={intro.schoolEval}
            errors={errors.s2}
            onChange={(patch) =>
              setIntro((p) => ({ ...p, schoolEval: { ...p.schoolEval, ...patch } }))
            }
          />
        )}
        {step === 2 && (
          <Step3PersonalExp
            data={intro.personalExp}
            errors={errors.s3}
            onChange={(patch) =>
              setIntro((p) => ({ ...p, personalExp: { ...p.personalExp, ...patch } }))
            }
          />
        )}
        {step === 3 && (
          <Step4Proof
            basic={basic}
            intro={intro}
            proof={proof}
            fileError={fileError || errors.s4}
            onProofChange={handleProofChange}
          />
        )}

        <div className={styles.footer}>
          {step > 0 ? (
            <button
              type="button"
              className={styles.btnBack}
              onClick={onBack}
              disabled={saving !== null}
            >
              ← 上一步
            </button>
          ) : (
            <span />
          )}
          <span className={styles.btnSpacer} />
          {step < 3 ? (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onNext}
              disabled={saving !== null}
            >
              {saving === "next" ? "保存中…" : "下一步 →"}
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSubmit}
              disabled={saving !== null}
            >
              {saving === "submit" ? "提交中…" : "提交审核"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
