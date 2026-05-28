"use client";

import styles from "../../dashboard/dashboard.module.css";

type Dim = { note: string };
type SchoolEval = {
  career?: Dim;
  teaching?: Dim;
  life?: Dim;
  care?: Dim;
  practice?: Dim;
  pros?: string;
  cons?: string;
};
type BoolText = { had: boolean; text: string };
type PersonalExp = {
  paths?: string[];
  research?: BoolText;
  internship?: BoolText;
  competition?: BoolText;
  zongping?: BoolText;
  program?: BoolText;
  transfer?: BoolText;
  supplement?: string;
};
export type IntroCard = {
  displayInitial?: string;
  displayTitle?: string;
  schoolEval?: SchoolEval;
  personalExp?: PersonalExp;
};

export type MentorFullProfile = {
  userId: string;
  email: string;
  name: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  highSchool: string | null;
  bio: string | null;
  tags: string[] | null;
  introCard: IntroCard | null;
  proofImageUrl: string | null;
};

const SCHOOL_EVAL_LABEL: Array<{ key: keyof SchoolEval; label: string }> = [
  { key: "career", label: "职业规划引导" },
  { key: "teaching", label: "教学质量" },
  { key: "life", label: "就读体验" },
  { key: "care", label: "人文关怀" },
  { key: "practice", label: "实践机会" },
];

const PATH_LABEL: Record<string, string> = {
  postgrad_domestic: "保研 / 直博",
  study_abroad: "出国留学",
  kaoyan: "国内考研",
  employment: "直接就业",
  civil_exam: "考公 / 考编",
  gap_other: "Gap / 其它",
};

const EXP_LABEL: Array<{ key: keyof PersonalExp; label: string }> = [
  { key: "research", label: "科研" },
  { key: "internship", label: "实习" },
  { key: "competition", label: "竞赛" },
  { key: "zongping", label: "综评 / 强基" },
  { key: "program", label: "特殊项目 / 班型" },
  { key: "transfer", label: "转专业" },
];

export function MentorProfileView({ mentor }: { mentor: MentorFullProfile }) {
  const card = mentor.introCard || {};
  const schoolEval = card.schoolEval || {};
  const personalExp = card.personalExp || {};
  const displayName =
    card.displayInitial && card.displayTitle
      ? `${card.displayInitial}${card.displayTitle}`
      : null;

  return (
    <div>
      <Section title="基本信息">
        <KV label="学校" value={mentor.school} />
        <KV label="院系" value={mentor.college} />
        <KV label="专业" value={mentor.major} />
        <KV label="年级" value={mentor.year} />
        <KV label="高中" value={mentor.highSchool} />
        <KV label="化名" value={displayName} />
        <KV label="标签" value={mentor.tags?.join("、") || null} />
      </Section>

      <Section title="自我介绍">
        <Para text={mentor.bio} />
      </Section>

      <Section title="学院评价">
        {SCHOOL_EVAL_LABEL.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>{label}</div>
            <Para text={(schoolEval[key] as Dim | undefined)?.note || null} />
          </div>
        ))}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>优势</div>
          <Para text={schoolEval.pros || null} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>不足</div>
          <Para text={schoolEval.cons || null} />
        </div>
      </Section>

      <Section title="个人经历">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>当前路径</div>
          <Para
            text={
              personalExp.paths && personalExp.paths.length > 0
                ? personalExp.paths.map((p) => PATH_LABEL[p] || p).join("、")
                : null
            }
          />
        </div>
        {EXP_LABEL.map(({ key, label }) => {
          const v = personalExp[key] as BoolText | undefined;
          return (
            <div key={key as string} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>
                {label}
                {v?.had ? "(有)" : "(无)"}
              </div>
              {v?.had ? (
                <Para text={v.text || null} />
              ) : (
                <span style={{ color: "#9a9a93", fontSize: 13 }}>—</span>
              )}
            </div>
          );
        })}
        {personalExp.supplement && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: "#9a9a93", marginBottom: 4 }}>补充</div>
            <Para text={personalExp.supplement} />
          </div>
        )}
      </Section>

      <Section title="身份学籍证明">
        {mentor.proofImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mentor.proofImageUrl}
            alt="证明"
            style={{
              maxWidth: 520,
              maxHeight: 420,
              border: "1px solid #ececec",
              borderRadius: 8,
            }}
          />
        ) : (
          <span style={{ color: "#a4391a", fontSize: 13 }}>未上传证明</span>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2
        style={{
          fontSize: 12,
          color: "#9a9a93",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          margin: "0 0 14px",
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "8px 0",
        borderBottom: "1px solid #f4f3ee",
      }}
    >
      <div style={{ width: 80, color: "#9a9a93", fontSize: 13, flexShrink: 0 }}>{label}</div>
      <div style={{ color: "#1f1f1f", fontSize: 14 }}>
        {value || <span style={{ color: "#a4391a" }}>未填</span>}
      </div>
    </div>
  );
}

function Para({ text }: { text: string | null | undefined }) {
  if (!text) return <span style={{ color: "#a4391a", fontSize: 13 }}>未填</span>;
  return (
    <p
      style={{
        margin: 0,
        whiteSpace: "pre-wrap",
        fontSize: 14,
        lineHeight: 1.7,
        color: "#1f1f1f",
      }}
    >
      {text}
    </p>
  );
}

// 触发 styles 引用以避免 tree-shake 警告(本组件目前未直接用 dashboard.module styles,但其它 admin 页面共享同一套)
void styles;
