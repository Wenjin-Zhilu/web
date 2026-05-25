"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import dashStyles from "../../../dashboard.module.css";
import styles from "./page.module.css";
import { SCHOOLS, DIM_HINTS } from "../../mock-data";
import type { Review } from "../../mock-data";

const DIM_ICONS: Record<string, string> = {
  career: "职",
  teaching: "教",
  life: "生",
  care: "关",
  practice: "践",
};

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewTop}>
        <div className={styles.reviewLabel}>
          <span className={styles.reviewDot} />
          {r.label}
        </div>
        {r.mentorSlug && (
          <Link href={`/dashboard/mentors/${r.mentorSlug}`} className={styles.reviewLink}>
            查看资料 →
          </Link>
        )}
      </div>
      <p className={styles.reviewText}>{r.text}</p>
    </div>
  );
}

export default function CollegePage({
  params,
}: {
  params: Promise<{ school: string; college: string }>;
}) {
  const { school: schoolSlug, college: collegeSlug } = use(params);
  const school = SCHOOLS.find((s) => s.slug === schoolSlug);
  if (!school) notFound();
  const college = school.colleges.find((c) => c.slug === collegeSlug);
  if (!college) notFound();

  return (
    <div className={dashStyles.content}>
      {/* Breadcrumb */}
      <div className={styles.crumb}>
        <Link href="/dashboard/reviews">院校列表</Link>
        <span className={styles.crumbSep}>/</span>
        <Link href={`/dashboard/reviews/${school.slug}`}>{school.name}</Link>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{college.name}</span>
      </div>

      <h1 className={dashStyles.pageTitle}>{college.name}</h1>
      <p className={dashStyles.pageSub}>
        {school.name} · {college.mentorCount} 位学长学姐评价 · {college.majors.join("、")}
      </p>

      {/* AI Summary */}
      <div className={styles.aiBlock}>
        <span className={styles.aiTag}>AI 综合摘要</span>
        <p className={styles.aiText}>{college.aiSummary}</p>
      </div>

      {/* Dimensions */}
      {college.dimensions.map((dim) => (
        <div key={dim.key} className={styles.dimension}>
          <div className={styles.dimHeader}>
            <div className={styles.dimIcon}>{DIM_ICONS[dim.key] || "评"}</div>
            <div>
              <h2 className={styles.dimTitle}>{dim.title}</h2>
              <span className={styles.dimHint}>{DIM_HINTS[dim.key]}</span>
            </div>
          </div>
          <div className={styles.reviewList}>
            {dim.reviews.map((r, i) => (
              <ReviewCard key={i} r={r} />
            ))}
          </div>
        </div>
      ))}

      {/* Pros / Cons */}
      {(college.pros.length > 0 || college.cons.length > 0) && (
        <div className={styles.prosConsGrid}>
          {college.pros.length > 0 && (
            <div className={styles.prosBlock}>
              <h3 className={styles.pcTitle}>优势</h3>
              {college.pros.map((item, i) => (
                <div key={i} className={styles.pcItem}>
                  <div className={styles.pcItemTop}>
                    <span className={styles.pcItemLabel}>{item.label}</span>
                    {item.mentorSlug && (
                      <Link href={`/dashboard/mentors/${item.mentorSlug}`} className={styles.pcItemLink}>
                        查看资料 →
                      </Link>
                    )}
                  </div>
                  <p className={styles.pcItemText}>{item.text}</p>
                </div>
              ))}
            </div>
          )}
          {college.cons.length > 0 && (
            <div className={styles.consBlock}>
              <h3 className={styles.pcTitle}>不足</h3>
              {college.cons.map((item, i) => (
                <div key={i} className={styles.pcItem}>
                  <div className={styles.pcItemTop}>
                    <span className={styles.pcItemLabel}>{item.label}</span>
                    {item.mentorSlug && (
                      <Link href={`/dashboard/mentors/${item.mentorSlug}`} className={styles.pcItemLink}>
                        查看资料 →
                      </Link>
                    )}
                  </div>
                  <p className={styles.pcItemText}>{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mentor cards */}
      <div className={styles.mentorZone}>
        <h2 className={styles.mentorZoneTitle}>{college.name}的学长学姐</h2>
        <p className={styles.mentorZoneSub}>
          以上评价来自经过身份验证的在读学长学姐。想深入了解，可以预约一次咨询。
        </p>
        <div className={styles.mentorGrid}>
          {college.mentors.map((m) => (
            <div key={m.slug} className={styles.mentorCard}>
              <div className={styles.mentorCardTop}>
                <div className={styles.mentorAvatar}>
                  {m.displayTitle === "学姐" ? "姐" : "兄"}
                </div>
                <div>
                  <div className={styles.mentorName}>
                    {m.major} · {m.displayTitle}
                  </div>
                  <div className={styles.mentorMeta}>{m.year}</div>
                </div>
              </div>
              <p className={styles.mentorOneLiner}>{m.oneLiner}</p>
              <Link href={`/dashboard/mentors/${m.slug}`} className={styles.mentorCta}>
                查看完整资料 →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
