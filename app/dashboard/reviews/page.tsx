"use client";
import { useState } from "react";
import Link from "next/link";
import dashStyles from "../dashboard.module.css";
import styles from "./page.module.css";
import { SCHOOLS } from "./mock-data";

export default function ReviewsPage() {
  const [query, setQuery] = useState("");
  const filtered = SCHOOLS.filter(
    (s) =>
      s.name.includes(query) ||
      s.colleges.some((c) => c.name.includes(query))
  );

  const totalMentors = SCHOOLS.reduce(
    (a, s) => a + s.colleges.reduce((b, c) => b + c.mentorCount, 0),
    0
  );
  const totalColleges = SCHOOLS.reduce((a, s) => a + s.colleges.length, 0);

  return (
    <div className={dashStyles.content}>
      <h1 className={dashStyles.pageTitle}>院校评价</h1>
      <p className={dashStyles.pageSub}>
        来自真实在读学长学姐的一手评价 · {SCHOOLS.length} 所院校 · {totalColleges} 个学院 · {totalMentors} 位参与
      </p>

      <input
        className={dashStyles.input}
        style={{ maxWidth: 360, marginBottom: 20 }}
        type="text"
        placeholder="搜索学校或学院名称…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.list}>
        {filtered.map((school) => (
          <Link
            key={school.slug}
            href={`/dashboard/reviews/${school.slug}`}
            className={styles.card}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardName}>{school.name}</span>
              <div className={styles.cardTags}>
                {school.tags.map((t) => (
                  <span key={t} className={styles.cardTag}>{t}</span>
                ))}
              </div>
              <span className={styles.cardArrow}>→</span>
            </div>
            <div className={styles.cardColleges}>
              {school.colleges.map((c) => (
                <span key={c.slug} className={styles.collegeChip}>
                  {c.name}
                  <span className={styles.collegeCount}>{c.mentorCount}</span>
                </span>
              ))}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className={dashStyles.emptyState}>
            暂无匹配的院校，试试其他关键词？
          </div>
        )}
      </div>
    </div>
  );
}
