"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { apiGet, formatCents, formatDateTime, ApiError } from "@/lib/api";
import styles from "./dashboard.module.css";

type IntroCard = {
  whyMajor?: string;
  regretOrSurprise?: string;
  fitFor?: string;
  notFitFor?: string;
  afterGraduation?: string;
};

type MentorProfile = {
  userId: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  tags: string[] | null;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  reviewReason: string | null;
  reviewedAt: string | null;
  introCard: IntroCard | null;
  ratingAvg: string;
  reviewsCount: number;
};

type ParentProfile = {
  id: string;
  parentRole: string | null;
  province: string | null;
  stage: string | null;
  intendedMajors: string[] | null;
  focusAreas: string[] | null;
  tilt: string | null;
};

type MeProfile = {
  user: { id: string; email: string; name: string; role: "parent" | "mentor" };
  parentProfile?: ParentProfile | null;
  mentorProfile?: MentorProfile | null;
};

type Order = {
  id: string;
  parentId: string;
  mentorId: string;
  slotId: string;
  status:
    | "scheduled"
    | "in_call"
    | "completed"
    | "cancelled_by_parent"
    | "cancelled_by_mentor"
    | "reviewed";
  topic: string | null;
  priceCents?: number;
  mentorPayoutCents?: number;
  paidAt: string | null;
  createdAt: string;
};

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

type Earnings = {
  settledCents: number;
  pendingCents: number;
  thisMonthSettledCents: number;
};

type SlotLite = {
  startAt: string;
  status: "open" | "booked" | "cancelled";
};

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [openFutureSlots, setOpenFutureSlots] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending || !session) return;
    let cancel = false;
    (async () => {
      try {
        const meRes = await apiGet<MeProfile>("/api/me/profile");
        if (cancel) return;
        setMe(meRes);

        const role = meRes.user.role;
        const ordersRes = await apiGet<{ orders: Order[] }>("/api/orders").catch(() => ({
          orders: [] as Order[],
        }));
        if (cancel) return;
        setOrders(ordersRes.orders);

        if (role === "parent") {
          const m = await apiGet<{ mentors: MentorListItem[] }>("/api/mentors").catch(() => ({
            mentors: [] as MentorListItem[],
          }));
          if (!cancel) setMentors(m.mentors);
        } else {
          const e = await apiGet<Earnings>("/api/mentors/me/earnings").catch(() => null);
          if (!cancel && e) setEarnings(e);
          if (meRes.mentorProfile?.reviewStatus === "approved") {
            const s = await apiGet<{ slots: SlotLite[] }>("/api/mentors/me/slots").catch(() => ({
              slots: [] as SlotLite[],
            }));
            if (!cancel) {
              const now = Date.now();
              setOpenFutureSlots(
                s.slots.filter((x) => x.status === "open" && new Date(x.startAt).getTime() > now)
                  .length,
              );
            }
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isPending, session]);

  if (isPending || loading || !me) {
    return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;
  }

  const role = me.user.role;
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";
  return (
    <>
      <div className={styles.topbar}>
        <span>{role === "mentor" ? "指路" : "问津"}</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>概览</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>欢迎回来{me.user.name ? `，${me.user.name}` : ""}</h1>
        <p className={styles.pageSub}>
          {role === "mentor"
            ? "看看你今天的咨询安排和最新审核进度。"
            : "看看可咨询的学长学姐、订单和最新状态。"}
        </p>

        {role === "parent" ? (
          <ParentOverview
            orders={orders}
            mentors={mentors}
            accent={accent}
          />
        ) : (
          <MentorOverview
            profile={me.mentorProfile ?? null}
            orders={orders}
            earnings={earnings}
            openFutureSlots={openFutureSlots}
            accent={accent}
          />
        )}
      </div>
    </>
  );
}

// ── Parent ─────────────────────────────────────────────────────────────

function ParentOverview({
  orders,
  mentors,
  accent,
}: {
  orders: Order[];
  mentors: MentorListItem[];
  accent: string;
}) {
  const upcoming = orders.filter((o) => o.status === "scheduled" || o.status === "in_call");
  const done = orders.filter((o) => o.status === "completed" || o.status === "reviewed");

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const uniqueSchools = useMemo(
    () => [...new Set(mentors.map((m) => m.school).filter(Boolean))] as string[],
    [mentors],
  );

  const afterSchool = selectedSchool
    ? mentors.filter((m) => m.school === selectedSchool)
    : mentors;

  const uniqueColleges = useMemo(
    () => [...new Set(afterSchool.map((m) => m.college).filter(Boolean))] as string[],
    [afterSchool],
  );

  const afterCollege = selectedCollege
    ? afterSchool.filter((m) => m.college === selectedCollege)
    : afterSchool;

  const uniqueCategories = useMemo(
    () => [...new Set(afterCollege.map((m) => m.majorCategory).filter(Boolean))] as string[],
    [afterCollege],
  );

  const filteredMentors = selectedCategory
    ? afterCollege.filter((m) => m.majorCategory === selectedCategory)
    : afterCollege;

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

  return (
    <>
      <div className={styles.grid3}>
        <div className={styles.card}>
          <p className={styles.cardSub}>待开始的咨询</p>
          <p className={styles.statValue} style={{ color: accent }}>
            {upcoming.length}
          </p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardSub}>已结束的咨询</p>
          <p className={styles.statValue}>{done.length}</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardSub}>可咨询的学长学姐</p>
          <p className={styles.statValue}>{filteredMentors.length}</p>
        </div>
      </div>

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

        {uniqueColleges.length > 0 && (
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

        {uniqueCategories.length > 0 && (
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

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>学长学姐</h2>
        </div>
        {filteredMentors.length === 0 ? (
          <div className={styles.emptyState}>
            {mentors.length === 0
              ? "暂时还没有可咨询的学长学姐。"
              : "没有符合条件的学长学姐，试试调整筛选条件。"}
          </div>
        ) : (
          <div className={styles.grid2}>
            {filteredMentors.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/mentors/${m.id}`}
                className={styles.card}
                style={{ textDecoration: "none" }}
              >
                <div className={styles.cardBanner} style={{ background: accent }} />
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

      {upcoming.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>即将开始</h2>
            <Link href="/dashboard/orders" className={`${styles.btn} ${styles.btnGhost}`}>
              全部咨询
            </Link>
          </div>
          <div className={styles.grid2}>
            {upcoming.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className={styles.card}
                style={{ textDecoration: "none" }}
              >
                <h3 className={styles.cardTitle}>{o.topic?.slice(0, 40) || "咨询订单"}</h3>
                <p className={styles.cardSub}>
                  下单于 {formatDateTime(o.createdAt)} · <OrderStatusPill status={o.status} />
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Mentor ─────────────────────────────────────────────────────────────

function MentorOverview({
  profile,
  orders,
  earnings,
  openFutureSlots,
  accent,
}: {
  profile: MentorProfile | null;
  orders: Order[];
  earnings: Earnings | null;
  openFutureSlots: number | null;
  accent: string;
}) {
  const upcoming = orders
    .filter((o) => o.status === "scheduled" || o.status === "in_call")
    .slice(0, 5);

  return (
    <>
      <ReviewStatusBanner profile={profile} openFutureSlots={openFutureSlots} accent={accent} />

      {earnings && (
        <div className={styles.grid3} style={{ marginTop: 16 }}>
          <div className={styles.card}>
            <p className={styles.cardSub}>已结算</p>
            <p className={styles.statValue} style={{ color: accent }}>
              {formatCents(earnings.settledCents)}
            </p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardSub}>待结算</p>
            <p className={styles.statValue}>{formatCents(earnings.pendingCents)}</p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardSub}>本月已结算</p>
            <p className={styles.statValue}>{formatCents(earnings.thisMonthSettledCents)}</p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>即将开始的咨询</h2>
          <Link href="/dashboard/orders" className={`${styles.btn} ${styles.btnGhost}`}>
            全部订单
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className={styles.emptyState}>暂时没有待开始的咨询。</div>
        ) : (
          <div className={styles.grid2}>
            {upcoming.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className={styles.card}
                style={{ textDecoration: "none" }}
              >
                <h3 className={styles.cardTitle}>{o.topic?.slice(0, 40) || "咨询订单"}</h3>
                <p className={styles.cardSub}>
                  下单于 {formatDateTime(o.createdAt)} · <OrderStatusPill status={o.status} />
                </p>
                {o.mentorPayoutCents != null && (
                  <p style={{ fontSize: 13, color: "#4a4a45", marginTop: 6 }}>
                    {formatCents(o.mentorPayoutCents)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ReviewStatusBanner({
  profile,
  openFutureSlots,
  accent,
}: {
  profile: MentorProfile | null;
  openFutureSlots: number | null;
  accent: string;
}) {
  if (!profile) {
    return (
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardBanner} style={{ background: accent }} />
        <h3 className={styles.cardTitle}>完成入驻资料</h3>
        <p className={styles.cardSub} style={{ marginBottom: 14 }}>
          学校 / 院系 / 5 个问答 + 学籍证明，提交后由 admin 人工审核。
        </p>
        <Link
          href="/onboarding"
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ background: accent }}
        >
          开始入驻
        </Link>
      </div>
    );
  }

  if (profile.reviewStatus === "draft") {
    return (
      <div className={styles.alertWarn} style={{ marginTop: 16 }}>
        <span>📝</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>资料未完成</div>
          <div>填写完所有必填字段并提交审核后，才能开始接咨询。</div>
        </div>
        <Link
          href="/dashboard/profile"
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ background: accent }}
        >
          去完善
        </Link>
      </div>
    );
  }
  if (profile.reviewStatus === "pending") {
    return (
      <div className={styles.alertWarn} style={{ marginTop: 16 }}>
        <span>⏳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>审核中</div>
          <div>资料已提交，请等待 admin 审核。审核通过后会在概览页提示。</div>
        </div>
      </div>
    );
  }
  if (profile.reviewStatus === "rejected") {
    return (
      <div className={styles.alertBad} style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>审核未通过</div>
        {profile.reviewReason && (
          <div style={{ marginBottom: 10 }}>原因：{profile.reviewReason}</div>
        )}
        <Link
          href="/dashboard/profile"
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ background: accent }}
        >
          修改并重新提交
        </Link>
      </div>
    );
  }
  if (openFutureSlots === 0) {
    return (
      <div className={styles.alertWarn} style={{ marginTop: 16 }}>
        <span>⏰</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>还差最后一步</div>
          <div>设置你的咨询档期,家长才能下单。</div>
        </div>
        <Link
          href="/dashboard/slots"
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ background: accent }}
        >
          去开放档期
        </Link>
      </div>
    );
  }
  return (
    <div className={styles.alertOk} style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 500, marginBottom: 2 }}>✓ 已通过审核</div>
      <div>你已经可以开放时间档期、接受咨询。</div>
    </div>
  );
}

// ── shared ─────────────────────────────────────────────────────────────

export function OrderStatusPill({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], { label: string; cls: string }> = {
    scheduled: { label: "待开始", cls: styles.pillNeutral },
    in_call: { label: "通话中", cls: styles.pillWarn },
    completed: { label: "已通话", cls: styles.pillOk },
    reviewed: { label: "已完成", cls: styles.pillOk },
    cancelled_by_parent: { label: "家长取消", cls: styles.pillBad },
    cancelled_by_mentor: { label: "学长学姐取消", cls: styles.pillBad },
  };
  const m = map[status];
  return <span className={`${styles.pill} ${m.cls}`}>{m.label}</span>;
}

// 兼容旧 ApiError 引用以防 tree-shake 警告
void ApiError;
