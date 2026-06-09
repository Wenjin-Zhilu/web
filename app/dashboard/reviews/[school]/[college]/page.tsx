"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import dashStyles from "../../../dashboard.module.css";
import styles from "./page.module.css";
import { apiGet } from "@/lib/api";
import { renderInlineMd } from "@/lib/inline-md";
import { DIM_HINTS } from "../../mock-data";
import type { Review, CollegeData } from "../../mock-data";

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

interface DetailResp {
  school: { name: string; tags: string[] };
  college: CollegeData;
}

export default function CollegePage({
  params,
}: {
  params: Promise<{ school: string; college: string }>;
}) {
  const { school: schoolEnc, college: collegeEnc } = use(params);
  const schoolName = decodeURIComponent(schoolEnc);
  const collegeName = decodeURIComponent(collegeEnc);

  const [data, setData] = useState<DetailResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = `/api/reviews/detail?school=${encodeURIComponent(schoolName)}&college=${encodeURIComponent(collegeName)}`;
    apiGet<DetailResp>(url)
      .then((res) => setData(res))
      .catch((e) => setError(e.message || "加载失败"))
      .finally(() => setLoading(false));
  }, [schoolName, collegeName]);

  if (loading) {
    return (
      <div className={dashStyles.content}>
        <div className={styles.crumb}>
          <Link href="/dashboard/reviews">院校列表</Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCurrent}>加载中…</span>
        </div>
        <p className={dashStyles.pageSub}>正在加载评价数据…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={dashStyles.content}>
        <div className={styles.crumb}>
          <Link href="/dashboard/reviews">院校列表</Link>
        </div>
        <div className={dashStyles.emptyState}>{error || "暂无评价数据"}</div>
      </div>
    );
  }

  const { school, college } = data;

  return (
    <div className={dashStyles.content}>
      {/* Breadcrumb */}
      <div className={styles.crumb}>
        <Link href="/dashboard/reviews">院校列表</Link>
        <span className={styles.crumbSep}>/</span>
        <Link href={`/dashboard/reviews/${encodeURIComponent(school.name)}`}>{school.name}</Link>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{college.name}</span>
      </div>

      <h1 className={dashStyles.pageTitle}>{college.name}</h1>
      <p className={dashStyles.pageSub}>
        {school.name} · {college.mentorCount} 位学长学姐评价 · {college.majors.join("、")}
      </p>

      {/* AI Summary */}
      {college.aiSummary && (
        <div className={styles.aiBlock}>
          <span className={styles.aiTag}>AI 综合摘要</span>
          <p className={styles.aiText}>{renderInlineMd(college.aiSummary)}</p>
        </div>
      )}

      {/* Dimensions */}
      {college.dimensions.map((dim) =>
        dim.reviews.length > 0 ? (
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
        ) : null
      )}

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
      {college.mentors.length > 0 && (
        <div className={styles.mentorZone}>
          <h2 className={styles.mentorZoneTitle}>{college.name}的学长学姐</h2>
          <p className={styles.mentorZoneSub}>
            以上评价来自经过身份验证的学长学姐。想深入了解，可以预约一次咨询。
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
      )}
    </div>
  );
}
