"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { apiGet } from "@/lib/api";
import styles from "../dashboard.module.css";

type MentorListItem = {
  id: string;
  name: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  tags: string[] | null;
  ratingAvg: string;
  reviewsCount: number;
  majorCategory: string | null;
};

export default function MatchPage() {
  const { data: session, isPending } = authClient.useSession();
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (isPending || !session) return;
    let cancel = false;
    (async () => {
      try {
        const m = await apiGet<{ mentors: MentorListItem[] }>("/api/mentors").catch(() => ({
          mentors: [] as MentorListItem[],
        }));
        if (!cancel) setMentors(m.mentors);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [isPending, session]);

  const uniqueSchools = useMemo(
    () => [...new Set(mentors.map((m) => m.school).filter(Boolean))] as string[],
    [mentors],
  );

  const afterSchool = selectedSchool
    ? mentors.filter((m) => m.school === selectedSchool)
    : [];

  const uniqueColleges = useMemo(
    () => selectedSchool
      ? [...new Set(afterSchool.map((m) => m.college).filter(Boolean))] as string[]
      : [],
    [afterSchool, selectedSchool],
  );

  const afterCollege = selectedCollege
    ? afterSchool.filter((m) => m.college === selectedCollege)
    : afterSchool;

  const uniqueCategories = useMemo(
    () => selectedSchool
      ? [...new Set(afterCollege.map((m) => m.majorCategory).filter(Boolean))] as string[]
      : [],
    [afterCollege, selectedSchool],
  );

  const filteredMentors = selectedCategory
    ? afterCollege.filter((m) => m.majorCategory === selectedCategory)
    : afterCollege;

  const hasAnyFilter = selectedSchool || selectedCollege || selectedCategory;

  const handleSchool = (v: string) => {
    setSelectedSchool(v === selectedSchool ? "" : v);
    setSelectedCollege("");
    setSelectedCategory("");
  };
  const handleCollege = (v: string) => {
    setSelectedCollege(v === selectedCollege ? "" : v);
    setSelectedCategory("");
  };
  const handleCategory = (v: string) => {
    setSelectedCategory(v === selectedCategory ? "" : v);
  };

  const accent = "#b8472d";

  if (isPending || loading) {
    return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <span>问津</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>匹配</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>找学长学姐</h1>
        <p className={styles.pageSub}>选择学校、院系和方向，找到最对口的学长学姐。</p>

        <div className={styles.filterSection}>
          {uniqueSchools.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupLabel}>学校</div>
              <div className={styles.filterPills}>
                {uniqueSchools.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.filterPill} ${selectedSchool === s ? styles.filterPillActive : ""}`}
                    onClick={() => handleSchool(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSchool && uniqueColleges.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupLabel}>院系</div>
              <div className={styles.filterPills}>
                {uniqueColleges.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.filterPill} ${selectedCollege === c ? styles.filterPillActive : ""}`}
                    onClick={() => handleCollege(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSchool && uniqueCategories.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupLabel}>方向</div>
              <div className={styles.filterPills}>
                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.filterPill} ${selectedCategory === cat ? styles.filterPillActive : ""}`}
                    onClick={() => handleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!hasAnyFilter ? (
          <div className={styles.emptyState}>
            请先选择一所学校，查看该校可咨询的学长学姐。
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className={styles.emptyState}>
            没有符合条件的学长学姐，试试调整筛选条件。
          </div>
        ) : (
          <div className={styles.grid2}>
            {filteredMentors.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/mentors/${m.id}`}
                className={styles.card}
                style={{ textDecoration: "none", position: "relative" }}
              >
                <div className={styles.cardBanner} style={{ background: accent }} />
                <div className={styles.verifiedBadge} title="已通过身份审核">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
                    <path d="M8 12.5 L11 15.5 L16.5 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>已通过身份审核</span>
                </div>
                <h3 className={styles.cardTitle}>
                  {m.name || "匿名学长学姐"} · {m.school || "—"}
                </h3>
                <p className={styles.cardSub}>
                  {m.major || "—"} · {m.year || "—"} · 评分 {Number(m.ratingAvg).toFixed(1)}
                </p>
                {m.bio && (
                  <p style={{ fontSize: 13, color: "#4a4a45", marginTop: 10, lineHeight: 1.6 }}>
                    {m.bio.slice(0, 80)}
                    {m.bio.length > 80 ? "…" : ""}
                  </p>
                )}
                {m.tags && m.tags.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.tags.slice(0, 4).map((t) => (
                      <span key={t} className={`${styles.pill} ${styles.pillNeutral}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
