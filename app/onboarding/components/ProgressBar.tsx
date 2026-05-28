// web/app/onboarding/components/ProgressBar.tsx
"use client";
import styles from "../onboarding.module.css";

const STEP_LABELS = ["基本信息", "学院介绍", "差异化经历", "身份学籍证明"] as const;

export function ProgressBar({ current }: { current: number }) {
  return (
    <div>
      <div className={styles.progressRow}>
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`${styles.progressSeg} ${i <= current ? styles.progressSegActive : ""}`}
          />
        ))}
      </div>
      <div className={styles.progressLabel}>
        步骤 {current + 1} / {STEP_LABELS.length} ·{" "}
        <span className={styles.progressLabelStrong}>{STEP_LABELS[current]}</span>
      </div>
    </div>
  );
}
