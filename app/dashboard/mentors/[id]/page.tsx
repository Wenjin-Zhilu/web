"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiSend, formatDateTime } from "@/lib/api";
import styles from "../../dashboard.module.css";

type Dim = { note: string };
type SchoolEval = {
  career: Dim;
  teaching: Dim;
  life: Dim;
  care: Dim;
  practice: Dim;
  pros: string;
  cons: string;
};
type PersonalExp = {
  paths: string[];
  research: { had: boolean; text: string };
  internship: { had: boolean; text: string };
  competition: { had: boolean; text: string };
  zongping: { had: boolean; text: string };
  program: { had: boolean; text: string };
  transfer: { had: boolean; text: string };
  supplement: string;
};
type IntroCard = {
  _lastStep?: number;
  displayInitial?: string;
  schoolEval?: SchoolEval;
  personalExp?: PersonalExp;
};

type MentorDetail = {
  id: string;
  name: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  tags: string[] | null;
  introCard: IntroCard | null;
  ratingAvg: string;
  reviewsCount: number;
};

type Slot = {
  id: string;
  mentorId: string;
  startAt: string;
  durationMins: number;
  status: "open" | "booked" | "cancelled";
};

type DetailResp = { mentor: MentorDetail; openSlots: Slot[] };

const ACCENT = "#b8472d";

const DIM_LABELS: { key: keyof Omit<SchoolEval, "pros" | "cons">; title: string }[] = [
  { key: "career", title: "职业规划引导" },
  { key: "teaching", title: "教学质量" },
  { key: "life", title: "就读体验" },
  { key: "care", title: "人文关怀" },
  { key: "practice", title: "实践机会" },
];

const PATH_LABEL: Record<string, string> = {
  postgrad_domestic: "保研 / 直博",
  study_abroad: "出国留学",
  kaoyan: "国内考研",
  employment: "直接就业",
  civil_exam: "考公 / 考编",
  gap_other: "Gap / 其它",
};

function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const m: Record<string, Slot[]> = {};
  for (const s of slots) {
    const d = new Date(s.startAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    (m[key] ||= []).push(s);
  }
  return m;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDay(key: string): string {
  const d = new Date(key);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`;
}

// ── 时间问询的日期 / 时间格 ──
const INQUIRY_DAYS_AHEAD = 14;
const WEEKDAY_CHARS = ["日", "一", "二", "三", "四", "五", "六"];

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildInquiryDays(): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < INQUIRY_DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

// 当天 08:00 – 22:30，每 30 分钟一格
function buildDayTimeCells(day: Date): Date[] {
  const out: Date[] = [];
  for (let h = 8; h < 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      out.push(d);
    }
  }
  return out;
}

function formatInquiryChip(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} 周${WEEKDAY_CHARS[d.getDay()]} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MentorDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<DetailResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pickedSlotId, setPickedSlotId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [inquiryDay, setInquiryDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [inquirySelected, setInquirySelected] = useState<Set<string>>(new Set());
  const [inquiryTopic, setInquiryTopic] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await apiGet<DetailResp>(`/api/mentors/${id}`);
        if (!cancel) setData(res);
      } catch (e) {
        if (!cancel) setErr((e as Error).message || "加载失败");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const book = async () => {
    if (!pickedSlotId) {
      alert("请先选择一个时间段");
      return;
    }
    if (!topic.trim()) {
      alert("请填写本次咨询想聊的主题");
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiSend<{ order: { id: string } }>("/api/orders", "POST", {
        slotId: pickedSlotId,
        topic: topic.trim(),
      });
      router.push(`/pay/${r.order.id}`);
    } catch (e) {
      alert((e as Error).message || "下单失败");
      setSubmitting(false);
    }
  };

  const toggleInquiryCell = (cell: Date) => {
    const iso = cell.toISOString();
    const next = new Set(inquirySelected);
    if (next.has(iso)) {
      next.delete(iso);
    } else {
      if (next.size >= 5) {
        alert("最多选择 5 个候选时段");
        return;
      }
      next.add(iso);
    }
    setInquirySelected(next);
  };

  const submitInquiry = async () => {
    if (inquirySelected.size === 0) {
      alert("请至少选择一个候选时段");
      return;
    }
    const options = Array.from(inquirySelected);
    setInquirySubmitting(true);
    try {
      await apiSend("/api/inquiries", "POST", {
        mentorId: id,
        options,
        topic: inquiryTopic.trim(),
      });
      alert("已发起时间问询，学长确认后你会在「时间问询」里看到结果。");
      router.push("/dashboard/inquiries");
    } catch (e) {
      alert((e as Error).message || "发起失败");
      setInquirySubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 32, color: "#6e6e68" }}>加载中…</div>;
  if (err)
    return (
      <div style={{ padding: 32 }}>
        <div className={styles.alertBad}>{err}</div>
        <Link href="/dashboard/match" className={`${styles.btn} ${styles.btnGhost}`} style={{ marginTop: 12 }}>
          ← 返回匹配
        </Link>
      </div>
    );
  if (!data) return null;

  const { mentor, openSlots } = data;
  const sEval = mentor.introCard?.schoolEval;
  const pExp = mentor.introCard?.personalExp;
  const grouped = groupSlotsByDate(openSlots);
  const dayKeys = Object.keys(grouped).sort();

  return (
    <>
      <div className={styles.topbar}>
        <Link href="/dashboard/match" style={{ color: "inherit", textDecoration: "none" }}>
          匹配
        </Link>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>{mentor.name}</span>
      </div>
      <div className={styles.content}>
        <Link href="/dashboard/match" className={`${styles.btn} ${styles.btnGhost}`} style={{ marginBottom: 16 }}>
          ← 返回匹配
        </Link>
        {/* 头部信息卡 */}
        <div className={styles.card} style={{ position: "relative" }}>
          <div className={styles.cardBanner} style={{ background: ACCENT }} />
          <div className={styles.verifiedBadge} title="已通过身份审核">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
              <path d="M8 12.5 L11 15.5 L16.5 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>已通过身份审核</span>
          </div>
          <h1 className={styles.pageTitle} style={{ marginBottom: 4 }}>
            {mentor.name}
          </h1>
          <p className={styles.cardSub} style={{ fontSize: 14, marginBottom: 12 }}>
            {[mentor.school, mentor.college, mentor.major, mentor.year].filter(Boolean).join(" · ")}
          </p>
          {mentor.bio && (
            <p style={{ fontSize: 14, color: "#4a4a45", lineHeight: 1.7, marginBottom: 12 }}>
              {mentor.bio}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {(mentor.tags ?? []).map((t) => (
              <span key={t} className={`${styles.pill} ${styles.pillNeutral}`}>
                {t}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#6e6e68" }}>
            评分 {Number(mentor.ratingAvg).toFixed(2)} · {mentor.reviewsCount} 条评价
          </p>
        </div>

        {/* 学院介绍 */}
        {sEval && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>学院介绍</h2>
            </div>
            <div className={styles.card}>
              <div style={{ display: "grid", gap: 14 }}>
                {DIM_LABELS.map(({ key, title }) => {
                  const d = sEval[key];
                  if (!d || !d.note?.trim()) return null;
                  return (
                    <div key={key}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#4a4a45", lineHeight: 1.7, margin: 0 }}>
                        {d.note}
                      </p>
                    </div>
                  );
                })}
              </div>
              {(sEval.pros || sEval.cons) && (
                <div className={styles.grid2} style={{ marginTop: 18 }}>
                  {sEval.pros && (
                    <div>
                      <p className={styles.cardSub} style={{ marginBottom: 6 }}>
                        我觉得最值
                      </p>
                      <p style={{ fontSize: 14, color: "#1f1f1f", lineHeight: 1.7 }}>
                        {sEval.pros}
                      </p>
                    </div>
                  )}
                  {sEval.cons && (
                    <div>
                      <p className={styles.cardSub} style={{ marginBottom: 6 }}>
                        我觉得最坑
                      </p>
                      <p style={{ fontSize: 14, color: "#1f1f1f", lineHeight: 1.7 }}>
                        {sEval.cons}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 个人经历 */}
        {pExp && <PersonalExpView exp={pExp} />}

        {/* 可预约时段 */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>可预约时段</h2>
          </div>
          {openSlots.length === 0 && (
            <div className={styles.emptyState}>
              该学长暂未开放固定档期。你可以在下方发起「时间问询」，提出你希望的时间，等待学长确认。
            </div>
          )}
          {openSlots.length > 0 && (
            <div className={styles.card}>
              {dayKeys.map((dk) => (
                <div key={dk} style={{ marginBottom: 16 }}>
                  <p
                    className={styles.cardSub}
                    style={{ marginBottom: 8, fontWeight: 500, color: "#1f1f1f" }}
                  >
                    {formatDay(dk)}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {grouped[dk].map((s) => {
                      const picked = pickedSlotId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setPickedSlotId(picked ? null : s.id)}
                          className={styles.btn}
                          style={{
                            background: picked ? ACCENT : "#fff",
                            color: picked ? "#fff" : "#1f1f1f",
                            border: picked ? `1px solid ${ACCENT}` : "1px solid #d8d8d2",
                            padding: "8px 14px",
                            fontSize: 14,
                          }}
                        >
                          {formatTime(s.startAt)} · {s.durationMins} 分钟
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 下单区 */}
        {openSlots.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>预约咨询</h2>
            </div>
            <div className={styles.card}>
              <label
                className={styles.cardSub}
                style={{ display: "block", marginBottom: 8 }}
                htmlFor="topic"
              >
                想聊点什么？(给学长学姐一个准备方向)
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：想了解 CS 保研 vs 找工作的取舍、双学位是否值得读…"
                rows={4}
                maxLength={500}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d8d8d2",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={book}
                  disabled={submitting || !pickedSlotId || !topic.trim()}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ background: ACCENT }}
                >
                  {submitting ? "下单中…" : "确认预约"}
                </button>
                {pickedSlotId && (
                  <span style={{ fontSize: 13, color: "#6e6e68" }}>
                    已选 {formatDateTime(openSlots.find((s) => s.id === pickedSlotId)?.startAt || "")}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#9a9a93", marginTop: 12 }}>
                下单成功后会进入订单详情页。测试期间暂以 mock 支付完成，正式版本会跳到支付宝二维码。
              </p>
            </div>
          </div>
        )}

        {/* 时间问询：约学长没开放的时段 */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>想约的时间这里没有？</h2>
          </div>
          <div className={styles.card}>
            <p className={styles.cardSub} style={{ marginBottom: 12 }}>
              点选你方便的时段（最多 5 个）发给学长。学长确认其中一个后会生成订单，你再支付即可。
            </p>

            {/* 日期横条 */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
              {buildInquiryDays().map((d) => {
                const sel = dayKeyOf(d) === dayKeyOf(inquiryDay);
                const isToday = dayKeyOf(d) === dayKeyOf(new Date());
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setInquiryDay(d)}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 10px",
                      border: "1px solid " + (sel ? ACCENT : "#ececec"),
                      borderRadius: 7,
                      background: sel ? ACCENT : "#fff",
                      color: sel ? "#fff" : "#1f1f1f",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 12,
                      minWidth: 54,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 10, opacity: 0.8 }}>
                      {WEEKDAY_CHARS[d.getDay()]}
                      {isToday && " · 今"}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1, fontFamily: "var(--serif)" }}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 时间格 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {buildDayTimeCells(inquiryDay).map((cell) => {
                const iso = cell.toISOString();
                const past = cell.getTime() <= Date.now();
                const picked = inquirySelected.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={past}
                    onClick={() => toggleInquiryCell(cell)}
                    style={{
                      padding: "9px 0",
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: "inherit",
                      cursor: past ? "not-allowed" : "pointer",
                      background: picked ? ACCENT : past ? "#f5f4ee" : "#fff",
                      color: picked ? "#fff" : past ? "#c0bfb6" : "#1f1f1f",
                      border: "1px solid " + (picked ? ACCENT : "#ececec"),
                      fontWeight: picked ? 600 : 400,
                    }}
                  >
                    {formatTime(iso)}
                  </button>
                );
              })}
            </div>

            {/* 已选候选时段 */}
            {inquirySelected.size > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p className={styles.cardSub} style={{ marginBottom: 6 }}>
                  已选 {inquirySelected.size} / 5 个候选时段
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Array.from(inquirySelected)
                    .sort()
                    .map((iso) => (
                      <span
                        key={iso}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          background: "#fbeee9",
                          border: "1px solid #f0cfc2",
                          borderRadius: 16,
                          fontSize: 13,
                          color: "#a4391a",
                        }}
                      >
                        {formatInquiryChip(iso)}
                        <button
                          type="button"
                          onClick={() => toggleInquiryCell(new Date(iso))}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#a4391a",
                            cursor: "pointer",
                            fontSize: 15,
                            lineHeight: 1,
                            padding: 0,
                          }}
                          aria-label="移除"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <textarea
              value={inquiryTopic}
              onChange={(e) => setInquiryTopic(e.target.value)}
              placeholder="想聊点什么？(给学长一个准备方向，选填)"
              rows={3}
              maxLength={500}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #d8d8d2",
                borderRadius: 8,
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 14,
                marginTop: 6,
              }}
            />
            <button
              type="button"
              onClick={submitInquiry}
              disabled={inquirySubmitting || inquirySelected.size === 0}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: ACCENT }}
            >
              {inquirySubmitting ? "发起中…" : "发起时间问询"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PersonalExpView({ exp }: { exp: PersonalExp }) {
  const items: { label: string; text: string }[] = [];
  if (exp.research.had && exp.research.text)
    items.push({ label: "科研经历", text: exp.research.text });
  if (exp.internship.had && exp.internship.text)
    items.push({ label: "实习经历", text: exp.internship.text });
  if (exp.competition.had && exp.competition.text)
    items.push({ label: "竞赛经历", text: exp.competition.text });
  if (exp.zongping.had && exp.zongping.text)
    items.push({ label: "综合评价 / 保送", text: exp.zongping.text });
  if (exp.program.had && exp.program.text)
    items.push({ label: "特色培养计划", text: exp.program.text });
  if (exp.transfer.had && exp.transfer.text)
    items.push({ label: "转专业经历", text: exp.transfer.text });

  const hasAny =
    exp.paths.length > 0 ||
    items.length > 0 ||
    (exp.supplement && exp.supplement.trim().length > 0);
  if (!hasAny) return null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>亲身经历</h2>
      </div>
      <div className={styles.card}>
        {exp.paths.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p className={styles.cardSub} style={{ marginBottom: 6 }}>
              走过的路
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {exp.paths.map((p) => (
                <span key={p} className={`${styles.pill} ${styles.pillNeutral}`}>
                  {PATH_LABEL[p] || p}
                </span>
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className={styles.grid2} style={{ marginTop: 6 }}>
            {items.map((it) => (
              <div key={it.label}>
                <p className={styles.cardSub} style={{ marginBottom: 4 }}>
                  {it.label}
                </p>
                <p style={{ fontSize: 14, color: "#1f1f1f", lineHeight: 1.7 }}>{it.text}</p>
              </div>
            ))}
          </div>
        )}

        {exp.supplement && exp.supplement.trim().length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #ececec" }}>
            <p className={styles.cardSub} style={{ marginBottom: 4 }}>
              其他补充
            </p>
            <p style={{ fontSize: 14, color: "#1f1f1f", lineHeight: 1.7 }}>
              {exp.supplement}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
