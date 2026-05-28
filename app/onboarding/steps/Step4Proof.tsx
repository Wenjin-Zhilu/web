// web/app/onboarding/steps/Step4Proof.tsx
"use client";
import styles from "../onboarding.module.css";
import type { IntroCard } from "@/lib/intro-card-schema";
import { PATH_OPTIONS } from "@/lib/intro-card-schema";
import type { Step1Data } from "./Step1Basic";

const DIM_LABEL: Record<string, string> = {
  career: "职业规划引导",
  teaching: "教学质量",
  life: "就读体验",
  care: "人文关怀",
  practice: "实践机会",
};

export type Step4Data = {
  proofDataUrl: string | null;
  proofExistingUrl: string | null; // 草稿里已有的证明
};

export function Step4Proof({
  basic,
  intro,
  proof,
  onProofChange,
  fileError,
}: {
  basic: Step1Data;
  intro: IntroCard;
  proof: Step4Data;
  onProofChange: (dataUrl: string | null) => void;
  fileError: string | null;
}) {
  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      onProofChange(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onProofChange(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const filledCount = (() => {
    let n = 0;
    if (intro.personalExp.research.had) n++;
    if (intro.personalExp.internship.had) n++;
    if (intro.personalExp.competition.had) n++;
    if (intro.personalExp.zongping.had) n++;
    if (intro.personalExp.program.had) n++;
    if (intro.personalExp.transfer.had) n++;
    return n;
  })();

  const pathsText = intro.personalExp.paths
    .map((k) => PATH_OPTIONS.find((p) => p.key === k)?.label || k)
    .join("、");

  const preview = proof.proofDataUrl || proof.proofExistingUrl;

  return (
    <div>
      <h1 className={styles.title}>身份学籍证明 + 确认提交</h1>
      <p className={styles.subtitle}>
        上传学生证 / 毕业证 / 学位证 / 校园卡截图。仅 admin 审核可见，家长看不到。
      </p>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>上传证明（≤ 2 MB）</label>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "#3d5c4d",
            color: "#fff",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
            width: "fit-content",
            userSelect: "none",
          }}
        >
          {preview ? "重新选择图片" : "选择图片上传"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            style={{ display: "none" }}
          />
        </label>
        <span style={{ marginTop: 6, fontSize: 12, color: "#9a9a93" }}>
          支持学生证 / 毕业证 / 学位证 / 校园卡截图，JPG / PNG ≤ 2 MB
        </span>
        {fileError && <span className={styles.errorText}>{fileError}</span>}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="证明预览"
            style={{
              marginTop: 12,
              maxWidth: 320,
              maxHeight: 220,
              border: "1px solid #ececec",
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <section
        style={{
          border: "1px solid #ececec",
          borderRadius: 9,
          padding: "16px 18px",
          marginTop: 24,
          background: "#fafaf8",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>填写概览</h3>
        <Row label="学校 / 院系 / 专业 / 年级">
          {basic.school} ｜ {basic.college} ｜ {basic.major} ｜ {basic.year}
        </Row>
        <Row label="学院介绍">
          {(["career", "teaching", "life", "care", "practice"] as const)
            .map((k) => `${DIM_LABEL[k]} ${intro.schoolEval[k].note.length} 字`)
            .join(" · ")}
        </Row>
        <Row label="优势 / 不足">
          优势 {intro.schoolEval.pros.length} 字 ｜ 不足 {intro.schoolEval.cons.length} 字
        </Row>
        <Row label="当前路径">{pathsText || "（未选）"}</Row>
        <Row label="差异化经历">已填 {filledCount} 项</Row>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", marginBottom: 8, fontSize: 13 }}>
      <div style={{ width: 130, color: "#9a9a93", flexShrink: 0 }}>{label}</div>
      <div style={{ color: "#1f1f1f", flex: 1 }}>{children}</div>
    </div>
  );
}

export function validateStep4(proof: Step4Data, fileSizeError: string | null): string | null {
  if (fileSizeError) return fileSizeError;
  if (!proof.proofDataUrl && !proof.proofExistingUrl) return "请上传身份学籍证明图片";
  return null;
}
