"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { mergeIntroCard, type IntroCard } from "@/lib/intro-card-schema";
import {
  Step1Basic,
  validateStep1,
  type Step1Data,
} from "@/app/onboarding/steps/Step1Basic";
import { Step2SchoolEval, validateStep2 } from "@/app/onboarding/steps/Step2SchoolEval";
import { Step3PersonalExp, validateStep3 } from "@/app/onboarding/steps/Step3PersonalExp";
import {
  Step4Proof,
  validateStep4,
  type Step4Data,
} from "@/app/onboarding/steps/Step4Proof";
import styles from "../dashboard.module.css";

type MentorProfile = {
  userId: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  highSchool: string | null;
  bio: string | null;
  tags: string[] | null;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  reviewReason: string | null;
  reviewedAt: string | null;
  introCard: unknown;
  proofImageUrl: string | null;
  ratingAvg: string;
  reviewsCount: number;
};

type ParentProfile = {
  id: string;
  parentRole: string | null;
  province: string | null;
  stage: string | null;
  intendedMajors: string[] | null;
  focusAreas: string[] | null;
  tilt: string | null;
  note: string | null;
};

type MeProfile = {
  user: { id: string; email: string; name: string; role: "parent" | "mentor" };
  parentProfile?: ParentProfile | null;
  mentorProfile?: MentorProfile | null;
};

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const sessionUserId = session?.user?.id;
  const [me, setMe] = useState<MeProfile | null>(null);

  useEffect(() => {
    if (!sessionUserId) return;
    apiGet<MeProfile>("/api/me/profile").then(setMe);
  }, [sessionUserId]);

  if (!me) return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;

  return me.user.role === "mentor" ? (
    <MentorProfileEditor profile={me.mentorProfile ?? null} userName={me.user.name} />
  ) : (
    <ParentProfileView profile={me.parentProfile ?? null} />
  );
}

// ── Mentor ─────────────────────────────────────────────────────────────

function MentorProfileEditor({
  profile,
  userName,
}: {
  profile: MentorProfile | null;
  userName: string;
}) {
  const accent = "#3d5c4d";
  const status = profile?.reviewStatus || "draft";
  const canSubmit = status === "draft" || status === "rejected";

  const initialIntro = mergeIntroCard(profile?.introCard);

  const [basic, setBasic] = useState<Step1Data>({
    school: profile?.school || "",
    college: profile?.college || "",
    major: profile?.major || "",
    year: profile?.year || "",
    highSchool: profile?.highSchool || "",
    displayInitial:
      initialIntro.displayInitial ||
      (userName.trim().charAt(0) || ""),
    displayTitle: initialIntro.displayTitle || "",
    bio: profile?.bio || "",
    tags: profile?.tags || [],
  });
  const [intro, setIntro] = useState<IntroCard>(initialIntro);
  const [proof, setProof] = useState<Step4Data>({
    proofDataUrl: null,
    proofExistingUrl: profile?.proofImageUrl || null,
  });
  const [fileError, setFileError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    s1: Partial<Record<keyof Step1Data, string>>;
    s2: Record<string, string>;
    s3: Record<string, string>;
    s4: string | null;
  }>({ s1: {}, s2: {}, s3: {}, s4: null });

  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const buildBody = () => {
    // 保留 _lastStep 原值，dashboard 不应改动 wizard 的进度记录
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
        displayInitial: basic.displayInitial,
        displayTitle: basic.displayTitle,
      },
    };
    if (proof.proofDataUrl) body.proofImageUrl = proof.proofDataUrl;
    return body;
  };

  const handleProofChange = (dataUrl: string | null) => {
    if (dataUrl === null) {
      setFileError("图片过大，请压缩到 2 MB 以内");
      return;
    }
    setFileError(null);
    setProof((p) => ({ ...p, proofDataUrl: dataUrl }));
  };

  const onSaveDraft = async () => {
    setSaving("draft");
    setMsg(null);
    try {
      await apiSend("/api/mentors/me/profile", "PATCH", buildBody());
      setMsg({ kind: "ok", text: "已保存草稿" });
      // 已上传的图片转为 existing
      if (proof.proofDataUrl) {
        setProof({ proofDataUrl: null, proofExistingUrl: proof.proofDataUrl });
      }
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const onSubmit = async () => {
    const e1 = validateStep1(basic);
    const e2 = validateStep2(intro.schoolEval);
    const e3 = validateStep3(intro.personalExp);
    const e4 = validateStep4(proof, fileError);
    setErrors({ s1: e1, s2: e2, s3: e3, s4: e4 });

    const hasError =
      Object.keys(e1).length > 0 ||
      Object.keys(e2).length > 0 ||
      Object.keys(e3).length > 0 ||
      e4 !== null;
    if (hasError) {
      setMsg({ kind: "err", text: "请修正下面的红色字段" });
      // 滚动到第一个错误（页面顶端的 alert 已经能告诉用户）
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving("submit");
    setMsg(null);
    try {
      await apiSend("/api/mentors/me/profile", "PATCH", buildBody());
      await apiSend("/api/mentors/me/profile/submit", "POST");
      setMsg({ kind: "ok", text: "已提交审核，等待 admin 处理。" });
      window.location.reload();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
      setSaving(null);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        <span>指路</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>资料与审核</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>资料与审核</h1>
        <p className={styles.pageSub}>
          修改后点保存草稿即可。提交审核后由 admin 处理。
        </p>

        <StatusBlock status={status} reason={profile?.reviewReason || null} accent={accent} />

        {msg && (
          <div
            className={msg.kind === "ok" ? styles.alertOk : styles.alertBad}
            style={{ marginTop: 16 }}
          >
            {msg.text}
          </div>
        )}

        <div className={styles.section}>
          <Step1Basic
            data={basic}
            errors={errors.s1}
            onChange={(patch) => setBasic((p) => ({ ...p, ...patch }))}
          />
        </div>

        <div className={styles.section}>
          <Step2SchoolEval
            data={intro.schoolEval}
            errors={errors.s2}
            onChange={(patch) =>
              setIntro((p) => ({ ...p, schoolEval: { ...p.schoolEval, ...patch } }))
            }
          />
        </div>

        <div className={styles.section}>
          <Step3PersonalExp
            data={intro.personalExp}
            errors={errors.s3}
            onChange={(patch) =>
              setIntro((p) => ({ ...p, personalExp: { ...p.personalExp, ...patch } }))
            }
          />
        </div>

        <div className={styles.section}>
          <Step4Proof
            basic={basic}
            intro={intro}
            proof={proof}
            fileError={fileError || errors.s4}
            onProofChange={handleProofChange}
          />
        </div>

        <div className={styles.section} style={{ display: "flex", gap: 10 }}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onSaveDraft}
            disabled={saving !== null}
          >
            {saving === "draft" ? "保存中…" : canSubmit ? "保存草稿" : "保存修改"}
          </button>
          {canSubmit && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: accent }}
              onClick={onSubmit}
              disabled={saving !== null}
            >
              {saving === "submit"
                ? "提交中…"
                : status === "rejected"
                ? "重新提交审核"
                : "提交审核"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}


function StatusBlock({
  status,
  reason,
  accent,
}: {
  status: "draft" | "pending" | "approved" | "rejected";
  reason: string | null;
  accent: string;
}) {
  if (status === "draft") {
    return (
      <div className={styles.alertWarn} style={{ marginTop: 12 }}>
        <span>📝</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>资料未提交</div>
          <div>完成所有必填字段（学校 / 院系 / 专业 / 年级 / 5 个问答 / 证明图）后点提交。</div>
        </div>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className={styles.alertWarn} style={{ marginTop: 12 }}>
        <span>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>审核中</div>
          <div>资料已提交，请等待 admin 审核。审核通过后会在概览页显示。</div>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className={styles.alertBad} style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 500 }}>审核未通过</div>
        {reason && <div style={{ marginTop: 4 }}>原因：{reason}</div>}
        <div style={{ marginTop: 4 }}>修改后可重新提交。</div>
      </div>
    );
  }
  return (
    <div className={styles.alertOk} style={{ marginTop: 12, borderColor: accent + "44" }}>
      <div style={{ fontWeight: 500 }}>✓ 已通过审核</div>
      <div>资料公开可见。编辑保存后不会回到待审核状态。</div>
    </div>
  );
}

// ── Parent ─────────────────────────────────────────────────────────────

const PARENT_ROLE_LABEL: Record<string, string> = {
  student: "学生",
  parent: "家长",
  teacher: "老师",
  other: "其他",
};
const STAGE_LABEL: Record<string, string> = {
  senior_pre: "高考前",
  senior_post: "高考后",
  g10_g11: "高一 / 高二",
  gap: "Gap",
  other: "其他",
};
const TILT_LABEL: Record<string, string> = {
  employment: "就业导向",
  grad_school: "升学 / 保研",
  overseas: "出国",
  experience: "体验为主",
  undecided: "尚未确定",
};

function ParentProfileView({ profile }: { profile: ParentProfile | null }) {
  const accent = "#b8472d";

  return (
    <>
      <div className={styles.topbar}>
        <span>问津</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>我的资料</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>我的资料</h1>
        <p className={styles.pageSub}>你的基本信息。</p>

        {profile ? (
          <div className={styles.grid2}>
            <InfoCard label="身份" value={profile.parentRole ? PARENT_ROLE_LABEL[profile.parentRole] || profile.parentRole : "—"} />
            <InfoCard label="所在省份" value={profile.province || "—"} />
            <InfoCard label="阶段" value={profile.stage ? STAGE_LABEL[profile.stage] || profile.stage : "—"} />
            <InfoCard label="升学倾向" value={profile.tilt ? TILT_LABEL[profile.tilt] || profile.tilt : "—"} />
          </div>
        ) : (
          <div className={styles.emptyState} style={{ marginTop: 16 }}>
            暂无资料。你可以直接在概览页浏览和筛选学长学姐。
          </div>
        )}
      </div>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardSub}>{label}</p>
      <p style={{ fontSize: 16, marginTop: 6, color: "#1f1f1f", fontWeight: 500 }}>{value}</p>
    </div>
  );
}
