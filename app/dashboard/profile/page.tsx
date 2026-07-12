"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { useSession, signOutAll } from "@/lib/auth-client";
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
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const [me, setMe] = useState<MeProfile | null>(null);

  useEffect(() => {
    if (!sessionUserId) return;
    apiGet<MeProfile>("/api/me/profile").then(setMe);
  }, [sessionUserId]);

  if (!me) return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;

  return (
    <>
      {me.user.role === "mentor" ? (
        <MentorProfileEditor profile={me.mentorProfile ?? null} userName={me.user.name} />
      ) : (
        <ParentProfileView profile={me.parentProfile ?? null} />
      )}
      <DeleteAccountSection />
    </>
  );
}

// ── 危险区域：注销账号 ─────────────────────────────────────────────────
function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const confirmDelete = async () => {
    setBusy(true);
    setErr(null);
    try {
      await apiSend("/api/me", "DELETE");
      await signOutAll();
      router.replace("/");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "注销失败，请稍后重试");
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 32,
        padding: "20px 22px",
        border: "1px solid #f0cfc2",
        background: "#fdf6f3",
        borderRadius: 10,
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 600, color: "#a4391a", margin: "0 0 6px" }}>
        危险区域
      </p>
      <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#6e6e68", margin: "0 0 14px" }}>
        注销后账号将被停用且无法再次登录。相关个人资料将不再对外展示，涉及交易与法律要求需保留的记录会依规留存。此操作不可撤销。
      </p>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "8px 16px",
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "inherit",
          cursor: "pointer",
          color: "#c0392b",
          background: "#ffffff",
          border: "1px solid #e2a99b",
        }}
      >
        注销账号
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31,31,31,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "24px 24px 20px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            <p style={{ fontSize: 17, fontWeight: 700, color: "#1f1f1f", margin: "0 0 10px" }}>
              确认注销账号？
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "#4a4842", margin: "0 0 18px" }}>
              账号将被停用且<strong>无法再次登录</strong>。请确认你已处理好进行中的咨询与钱包余额。此操作不可撤销。
            </p>
            {err && (
              <p style={{ fontSize: 13, color: "#c0392b", margin: "0 0 12px" }}>{err}</p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: busy ? "not-allowed" : "pointer",
                  color: "#1f1f1f",
                  background: "#ffffff",
                  border: "1px solid #e0dfd8",
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: busy ? "not-allowed" : "pointer",
                  color: "#ffffff",
                  background: "#c0392b",
                  border: "1px solid #c0392b",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "注销中…" : "确认注销"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
const ENUM_TO_ROLE: Record<string, string> = {
  student: "学生本人",
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
const ENUM_TO_STAGE: Record<string, string> = {
  senior_pre: "高三 · 出分前",
  senior_post: "高三 · 出分后",
  g10_g11: "高一 / 高二",
  gap: "复读",
  other: "其他",
};
const ROLE_OPTS = ["学生本人", "家长", "老师", "其他"];
const ROLE_TO_ENUM: Record<string, string> = { "学生本人": "student", "家长": "parent", "老师": "teacher", "其他": "other" };
const STAGE_OPTS = ["高三 · 出分前", "高三 · 出分后", "高一 / 高二", "复读", "其他"];
const STAGE_TO_ENUM: Record<string, string> = { "高三 · 出分前": "senior_pre", "高三 · 出分后": "senior_post", "高一 / 高二": "g10_g11", "复读": "gap", "其他": "other" };

function ParentProfileView({ profile }: { profile: ParentProfile | null }) {
  const accent = "#b8472d";
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(profile);

  const [role, setRole] = useState(current?.parentRole ? ENUM_TO_ROLE[current.parentRole] || "" : "");
  const [province, setProvince] = useState(current?.province || "");
  const [stage, setStage] = useState(current?.stage ? ENUM_TO_STAGE[current.stage] || "" : "");
  const [highSchool, setHighSchool] = useState((current as Record<string, unknown>)?.highSchool as string || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = role && province.trim() && stage && highSchool.trim();

  const onSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await apiSend("/api/parent-profile", "POST", {
        parentRole: ROLE_TO_ENUM[role],
        province: province.trim(),
        stage: STAGE_TO_ENUM[stage],
        highSchool: highSchool.trim(),
      });
      setCurrent({
        ...current!,
        parentRole: ROLE_TO_ENUM[role],
        province: province.trim(),
        stage: STAGE_TO_ENUM[stage],
      });
      setEditing(false);
    } catch (e) {
      setError((e as Error).message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        <span>问津</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>我的资料</span>
      </div>
      <div className={styles.content}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 className={styles.pageTitle}>我的资料</h1>
          {current && !editing && (
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setEditing(true)}
            >
              编辑
            </button>
          )}
        </div>
        <p className={styles.pageSub}>你的基本信息。</p>

        {editing ? (
          <div style={{ maxWidth: 480 }}>
            <div className={styles.field}>
              <label className={styles.label}>你是？</label>
              <div className={styles.filterPills}>
                {ROLE_OPTS.map((r) => (
                  <button key={r} type="button" className={`${styles.filterPill} ${role === r ? styles.filterPillActive : ""}`} onClick={() => setRole(r)}>{r}</button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>高考地区</label>
              <input className={styles.input} placeholder="例如：上海、浙江、江苏…" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>目前阶段</label>
              <div className={styles.filterPills}>
                {STAGE_OPTS.map((s) => (
                  <button key={s} type="button" className={`${styles.filterPill} ${stage === s ? styles.filterPillActive : ""}`} onClick={() => setStage(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>高中学校</label>
              <input className={styles.input} placeholder="例如：上海中学、复旦附中…" value={highSchool} onChange={(e) => setHighSchool(e.target.value)} />
            </div>
            {error && <p style={{ color: "#a4391a", fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: accent }}
                disabled={!canSubmit || saving}
                onClick={onSave}
              >
                {saving ? "保存中…" : "保存"}
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                取消
              </button>
            </div>
          </div>
        ) : current ? (
          <div className={styles.grid2}>
            <InfoCard label="身份" value={current.parentRole ? PARENT_ROLE_LABEL[current.parentRole] || current.parentRole : "—"} />
            <InfoCard label="高考地区" value={current.province || "—"} />
            <InfoCard label="阶段" value={current.stage ? STAGE_LABEL[current.stage] || current.stage : "—"} />
            <InfoCard label="高中学校" value={(current as Record<string, unknown>).highSchool as string || "—"} />
          </div>
        ) : (
          <div className={styles.emptyState} style={{ marginTop: 16 }}>
            暂无资料。返回概览页会弹出资料填写弹窗。
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
