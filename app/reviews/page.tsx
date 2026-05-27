"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import styles from "./page.module.css";

const DIM_META: { key: string; title: string; ico: string }[] = [
  { key: "career", title: "职业规划引导", ico: "职" },
  { key: "teaching", title: "教学质量", ico: "教" },
  { key: "life", title: "就读体验", ico: "生" },
  { key: "care", title: "人文关怀", ico: "关" },
  { key: "practice", title: "实践机会", ico: "践" },
];

interface SchoolEval {
  career?: { note?: string };
  teaching?: { note?: string };
  life?: { note?: string };
  care?: { note?: string };
  practice?: { note?: string };
  pros?: string;
  cons?: string;
}

interface FeaturedReview {
  displayTitle: string;
  displayInitial: string;
  college: string;
  major: string;
  year: string;
  schoolEval: SchoolEval;
}

interface OtherCollege {
  college: string;
  major: string;
  displayTitle: string;
}

interface SchoolPreview {
  name: string;
  tags: string[];
  totalMentors: number;
  totalColleges: number;
  featured: FeaturedReview | null;
  otherColleges: OtherCollege[];
}

function pickInitial(rev: FeaturedReview): string {
  if (rev.displayInitial && rev.displayInitial.trim().length > 0) {
    return rev.displayInitial.trim().slice(0, 1);
  }
  return rev.displayTitle === "学姐" ? "姐" : "兄";
}

function isMeaningful(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 12) return false;
  // 过滤掉敷衍式填写
  if (/我未亲身接触|并未亲身|不太了解|无评价|没什么/.test(t) && t.length < 30) return false;
  return true;
}

export default function ReviewsPreviewPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [schools, setSchools] = useState<SchoolPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    apiGet<{ schools: SchoolPreview[] }>("/api/reviews/preview")
      .then((res) => {
        setSchools(res.schools);
        const firstWithData = res.schools.findIndex((s) => s.featured);
        setActiveIdx(firstWithData >= 0 ? firstWithData : 0);
      })
      .catch((e) => setError(e.message || "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const totalMentors = useMemo(
    () => schools.reduce((a, s) => a + s.totalMentors, 0),
    [schools]
  );
  const totalColleges = useMemo(
    () => schools.reduce((a, s) => a + s.totalColleges, 0),
    [schools]
  );
  const schoolsWithData = useMemo(
    () => schools.filter((s) => s.totalMentors > 0).length,
    [schools]
  );

  const isLoggedIn = !sessionPending && !!session;
  const current = schools[activeIdx];

  const lockHref = isLoggedIn ? "/dashboard/reviews" : "/auth?mode=login&redirect=/dashboard/reviews";
  const registerHref = "/auth?mode=register&redirect=/dashboard/reviews";

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandLogo}>津</div>
          <span className={styles.brandText}>问津</span>
          <span className={styles.brandSub}>FOR FAMILIES</span>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/">首页</Link>
          <Link href="/questions">家长都在问</Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className={styles.navBtn}>
              进入工作台
            </Link>
          ) : (
            <Link href="/auth?mode=login" className={styles.navBtn}>
              登录
            </Link>
          )}
        </nav>
      </header>

      <div className={styles.page}>
        <h1 className={styles.pageTitle}>院校评价 🔥</h1>
        <p className={styles.pageSub}>
          来自真实在读学长学姐的一手评价 · {schoolsWithData} 所院校 · {totalColleges} 个学院 · {totalMentors} 位参与
        </p>

        {loading ? (
          <div className={styles.loading}>加载中…</div>
        ) : error ? (
          <div className={styles.errorBlock}>加载失败：{error}</div>
        ) : (
          <div className={styles.cols}>
            <aside className={styles.indexBox}>
              <div className={styles.indexTitle}>院校列表</div>
              <div className={styles.indexList}>
                {schools.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    className={
                      `${styles.indexItem} ` +
                      (i === activeIdx ? styles.active : "") +
                      (s.totalMentors === 0 ? ` ${styles.empty}` : "")
                    }
                    onClick={() => setActiveIdx(i)}
                  >
                    <span>{s.name}</span>
                    <span className={styles.indexCnt}>
                      {s.totalMentors > 0 ? `${s.totalMentors} 位` : "0"}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div>
              {current && (
                <>
                  <div className={styles.schoolHead}>
                    <div className={styles.schoolName}>{current.name}</div>
                    {current.tags.map((t) => (
                      <span key={t} className={styles.schoolTag}>{t}</span>
                    ))}
                    {current.totalMentors > 0 && (
                      <div className={styles.schoolStats}>
                        <b>{current.totalMentors}</b> 位学长学姐 · <b>{current.totalColleges}</b> 个学院
                      </div>
                    )}
                  </div>

                  {current.featured ? (
                    <>
                      <p className={styles.schoolIntro}>
                        已收录 {current.totalMentors} 位{current.name}学长学姐的院校评价
                        {current.totalMentors > 1 ? "，下方是评分最完整、内容最详尽的一条。" : "。"}
                      </p>

                      <FeaturedCard review={current.featured} />

                      <LockBlock
                        schoolName={current.name}
                        otherColleges={current.otherColleges}
                        totalMentors={current.totalMentors}
                        isLoggedIn={isLoggedIn}
                        lockHref={lockHref}
                        registerHref={registerHref}
                      />
                    </>
                  ) : (
                    <div className={styles.emptyPanel}>
                      <div className={styles.emptyIcon}>🌱</div>
                      <div className={styles.emptyTitle}>这所学校还没有学长学姐入驻</div>
                      <div className={styles.emptySub}>
                        你是{current.name}的在读学长学姐？写一条评价，让更多学弟学妹听到你的视角，同时接单一对一咨询，<b className={styles.emptyHighlight}>赚取高额收益</b>。
                      </div>
                      <Link href="/mentor" className={styles.btnPrimary}>我是学长学姐，加入指路</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ review }: { review: FeaturedReview }) {
  const se = review.schoolEval || {};
  return (
    <div className={styles.reviewCard}>
      <div className={styles.cardHead}>
        <div className={styles.avatar}>{pickInitial(review)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.cardName}>
            {review.displayTitle === "学姐" ? "某学姐" : "某学长"}（化名）
          </div>
          <div className={styles.cardMeta}>
            <b>{review.college}</b>
            {review.year ? ` · ${review.year}` : ""}
            {review.major ? ` · ${review.major}` : ""}
          </div>
        </div>
      </div>

      {(isMeaningful(se.pros) || isMeaningful(se.cons)) && (
        <div className={styles.prosConsGrid}>
          {isMeaningful(se.pros) && (
            <div className={styles.prosBox}>
              <div className={styles.boxLabel}>✦ 我推荐</div>
              {se.pros}
            </div>
          )}
          {isMeaningful(se.cons) && (
            <div className={styles.consBox}>
              <div className={styles.boxLabel}>⚠ 也要注意</div>
              {se.cons}
            </div>
          )}
        </div>
      )}

      <div className={styles.dimGrid}>
        {DIM_META.map((dim) => {
          const note = (se as Record<string, { note?: string } | undefined>)[dim.key]?.note;
          if (!isMeaningful(note)) return null;
          return (
            <div key={dim.key} className={styles.dimRow}>
              <div className={styles.dimLabel}>
                <span className={styles.dimIco}>{dim.ico}</span>
                {dim.title}
              </div>
              <div className={styles.dimText}>{note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockBlock({
  schoolName,
  otherColleges,
  totalMentors,
  isLoggedIn,
  lockHref,
  registerHref,
}: {
  schoolName: string;
  otherColleges: OtherCollege[];
  totalMentors: number;
  isLoggedIn: boolean;
  lockHref: string;
  registerHref: string;
}) {
  const teaser = otherColleges[0];
  const hasMore = otherColleges.length > 0;

  let title: React.ReactNode;
  let sub: string;
  if (hasMore) {
    title = (
      <>
        注册后可以看到 <b>{schoolName}其余 {otherColleges.length} 位学长学姐</b> 的完整评价
      </>
    );
    const colleges = otherColleges.map((c) => c.college).slice(0, 3).join("、");
    sub = `包括${colleges}${otherColleges.length > 3 ? " 等" : ""}——以及联系学长学姐一对一咨询。`;
  } else {
    title = (
      <>
        注册后可以联系 <b>{schoolName}学长学姐一对一咨询</b>
      </>
    );
    sub = "还可以解锁全部院校共多位学长学姐的完整评价。";
  }

  if (isLoggedIn) {
    title = (
      <>
        查看 <b>{schoolName}</b> 的全部院校评价
      </>
    );
    sub = totalMentors > 1
      ? `已收录 ${totalMentors} 位学长学姐的完整评价，点击进入查看全部。`
      : "进入工作台查看该学长学姐的完整评价。";
  }

  const teaserInitial = teaser?.displayTitle === "学姐" ? "姐" : "兄";

  return (
    <div className={styles.lockBlock}>
      {/* 真实学长卡头（不模糊） */}
      {teaser ? (
        <div className={styles.lockTeaserHead}>
          <div className={styles.avatar}>{teaserInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.cardName}>
              {teaser.displayTitle === "学姐" ? "某学姐" : "某学长"}（化名）
            </div>
            <div className={styles.cardMeta}>
              <b>{teaser.college}</b>
              {teaser.major ? ` · ${teaser.major}` : ""}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.lockTeaserHead}>
          <div className={styles.avatar}>?</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.cardName}>更多学长学姐正在加入</div>
            <div className={styles.cardMeta}>
              <b>来自全国 985 / 211 院校</b>
            </div>
          </div>
        </div>
      )}

      {/* 模糊的正文骨架 */}
      <div className={styles.lockPreview} aria-hidden>
        <div className={styles.lpProsCons}>
          <div className={styles.lpBox}>
            <div className={`${styles.lpBar} ${styles.lpBarShort}`} />
            <div className={`${styles.lpBar} ${styles.lpBarLong}`} style={{ marginTop: 8 }} />
            <div className={`${styles.lpBar} ${styles.lpBarLong}`} style={{ marginTop: 6 }} />
            <div className={`${styles.lpBar} ${styles.lpBarMed}`} style={{ marginTop: 6 }} />
          </div>
          <div className={styles.lpBox}>
            <div className={`${styles.lpBar} ${styles.lpBarShort}`} />
            <div className={`${styles.lpBar} ${styles.lpBarLong}`} style={{ marginTop: 8 }} />
            <div className={`${styles.lpBar} ${styles.lpBarMed}`} style={{ marginTop: 6 }} />
          </div>
        </div>
        <div className={`${styles.lpBar} ${styles.lpBarLong}`} style={{ marginTop: 12 }} />
        <div className={`${styles.lpBar} ${styles.lpBarLong}`} style={{ marginTop: 8 }} />
        <div className={`${styles.lpBar} ${styles.lpBarMed}`} style={{ marginTop: 8 }} />
      </div>

      <div className={styles.lockOverlay}>
        <div className={styles.lockIcon}>{isLoggedIn ? "→" : "🔒"}</div>
        <div className={styles.lockTitle}>{title}</div>
        <div className={styles.lockSub}>{sub}</div>
        <div className={styles.lockActions}>
          {isLoggedIn ? (
            <Link href={lockHref} className={styles.btnPrimary}>查看完整评价</Link>
          ) : (
            <>
              <Link href={registerHref} className={styles.btnPrimary}>立即注册解锁</Link>
              <Link href={lockHref} className={styles.btnGhost}>已注册？登录</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
