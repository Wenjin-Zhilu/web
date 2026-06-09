"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import dashStyles from "../../dashboard.module.css";
import styles from "./page.module.css";
import { apiGet } from "@/lib/api";
import { renderInlineMd } from "@/lib/inline-md";
import type { SchoolData } from "../mock-data";

export default function SchoolPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school: schoolName } = use(params);
  const decoded = decodeURIComponent(schoolName);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ schools: SchoolData[] }>("/api/reviews")
      .then((res) => {
        const found = res.schools.find((s) => s.name === decoded);
        setSchool(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [decoded]);

  if (loading) {
    return (
      <div className={dashStyles.content}>
        <div className={styles.crumb}>
          <Link href="/dashboard/reviews">← 院校列表</Link>
        </div>
        <p className={dashStyles.pageSub}>加载中…</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className={dashStyles.content}>
        <div className={styles.crumb}>
          <Link href="/dashboard/reviews">← 院校列表</Link>
        </div>
        <div className={dashStyles.emptyState}>未找到该院校的评价数据</div>
      </div>
    );
  }

  const totalMentors = school.colleges.reduce((a, c) => a + c.mentorCount, 0);

  return (
    <div className={dashStyles.content}>
      <div className={styles.crumb}>
        <Link href="/dashboard/reviews">← 院校列表</Link>
      </div>
      <h1 className={dashStyles.pageTitle}>
        {school.name}
        {school.tags.map((t) => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </h1>
      <p className={dashStyles.pageSub}>
        {school.colleges.length} 个学院 · {totalMentors} 位学长学姐评价
      </p>

      <div className={styles.list}>
        {school.colleges.map((college) => (
          <Link
            key={college.name}
            href={`/dashboard/reviews/${encodeURIComponent(school.name)}/${encodeURIComponent(college.name)}`}
            className={styles.collegeCard}
          >
            <div className={styles.collegeCardLeft}>
              <h2 className={styles.collegeCardName}>{college.name}</h2>
              <div className={styles.collegeCardMajors}>
                {college.majors.join(" · ")}
              </div>
              {college.aiSummary && (
                <p className={styles.collegeCardSummary}>{renderInlineMd(college.aiSummary)}</p>
              )}
            </div>
            <div className={styles.collegeCardRight}>
              <div className={styles.collegeCardStat}>
                <span className={styles.collegeCardNum}>{college.mentorCount}</span>
                <span className={styles.collegeCardLabel}>位学长学姐</span>
              </div>
              <span className={styles.collegeCardArrow}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
