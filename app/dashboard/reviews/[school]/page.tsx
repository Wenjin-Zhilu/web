"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import dashStyles from "../../dashboard.module.css";
import styles from "./page.module.css";
import { SCHOOLS } from "../mock-data";

export default function SchoolPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school: slug } = use(params);
  const school = SCHOOLS.find((s) => s.slug === slug);
  if (!school) notFound();

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
            key={college.slug}
            href={`/dashboard/reviews/${school.slug}/${college.slug}`}
            className={styles.collegeCard}
          >
            <div className={styles.collegeCardLeft}>
              <h2 className={styles.collegeCardName}>{college.name}</h2>
              <div className={styles.collegeCardMajors}>
                {college.majors.join(" · ")}
              </div>
              <p className={styles.collegeCardSummary}>{college.aiSummary}</p>
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
