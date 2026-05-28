"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dashStyles from "../dashboard.module.css";
import styles from "./page.module.css";
import { apiGet } from "@/lib/api";
import type { SchoolData } from "./mock-data";

export default function ReviewsPage() {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ schools: SchoolData[] }>("/api/reviews")
      .then((res) => setSchools(res.schools))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = schools.filter(
    (s) =>
      s.name.includes(query) ||
      s.colleges.some((c) => c.name.includes(query))
  );

  const totalMentors = schools.reduce(
    (a, s) => a + s.colleges.reduce((b, c) => b + c.mentorCount, 0),
    0
  );
  const totalColleges = schools.reduce((a, s) => a + s.colleges.length, 0);

  if (loading) {
    return (
      <div className={dashStyles.content}>
        <h1 className={dashStyles.pageTitle}>院校评价</h1>
        <p className={dashStyles.pageSub}>加载中…</p>
      </div>
    );
  }

  return (
    <div className={dashStyles.content}>
      <h1 className={dashStyles.pageTitle}>院校评价</h1>
      <p className={dashStyles.pageSub}>
        来自真实学长学姐的一手评价 · {schools.length} 所院校 · {totalColleges} 个学院 · {totalMentors} 位参与
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
            key={school.name}
            href={`/dashboard/reviews/${encodeURIComponent(school.name)}`}
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
                <span key={c.name} className={styles.collegeChip}>
                  {c.name}
                  <span className={styles.collegeCount}>{c.mentorCount}</span>
                </span>
              ))}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className={dashStyles.emptyState}>
            {schools.length === 0
              ? "暂无评价数据，学长学姐正在入驻中…"
              : "暂无匹配的院校，试试其他关键词？"}
          </div>
        )}
      </div>
    </div>
  );
}
