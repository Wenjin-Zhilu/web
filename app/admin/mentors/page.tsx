"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { apiGet, apiSend, formatDateTime, ApiError } from "@/lib/api";
import styles from "../../dashboard/dashboard.module.css";
import { MentorProfileView, type MentorFullProfile } from "../_components/MentorProfileView";

type Dim = { note: string };
type SchoolEval = {
  career?: Dim; teaching?: Dim; life?: Dim; care?: Dim; practice?: Dim;
  pros?: string; cons?: string;
};
type BoolText = { had: boolean; text: string };
type PersonalExp = {
  paths?: string[];
  research?: BoolText; internship?: BoolText; competition?: BoolText;
  zongping?: BoolText; program?: BoolText; transfer?: BoolText;
  supplement?: string;
};
type IntroCard = {
  displayInitial?: string; displayTitle?: string;
  schoolEval?: SchoolEval; personalExp?: PersonalExp;
};

type ExportMentor = {
  userId: string; email: string; name: string;
  school: string | null; college: string | null; major: string | null;
  year: string | null; highSchool: string | null; bio: string | null;
  tags: string[] | null; majorCategory: string | null;
  introCard: IntroCard | null;
  ratingAvg: string; reviewsCount: number;
  reviewedAt: string | null; createdAt: string;
};

const MAJOR_CATEGORIES = [
  "工学", "理学", "文学", "商学", "管理学", "法学", "医学", "艺术学", "教育学", "农学",
];

type ApprovedMentor = {
  userId: string;
  email: string;
  name: string;
  school: string | null;
  college: string | null;
  major: string | null;
  year: string | null;
  tags: string[] | null;
  majorCategory: string | null;
  ratingAvg: string;
  reviewsCount: number;
  reviewedAt: string | null;
  createdAt: string;
};

type DetailResp = {
  mentor: MentorFullProfile & {
    reviewedAt: string | null;
    ratingAvg: string;
    reviewsCount: number;
  };
};

type ViewMode = "list" | "school";

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<ApprovedMentor[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<DetailResp["mentor"] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const saveCategory = async (userId: string, majorCategory: string | null) => {
    try {
      await apiSend(`/api/admin/mentors/${userId}/category`, "PATCH", { majorCategory });
      setMentors((prev) =>
        prev
          ? prev.map((m) => (m.userId === userId ? { ...m, majorCategory } : m))
          : prev,
      );
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    }
    setEditingCat(null);
  };

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailErr(null);
    setDetail(null);
    try {
      const r = await apiGet<DetailResp>(`/api/admin/mentors/${userId}/detail`);
      setDetail(r.mentor);
    } catch (e) {
      setDetailErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await apiGet<{ mentors: ApprovedMentor[] }>("/api/admin/mentors/approved");
        if (!cancel) setMentors(r.mentors);
      } catch (e) {
        if (!cancel) setErr(e instanceof ApiError ? e.message : (e as Error).message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = mentors
    ? mentors.filter((m) => {
        if (!q.trim()) return true;
        const s = q.trim().toLowerCase();
        return (
          m.name?.toLowerCase().includes(s) ||
          m.email?.toLowerCase().includes(s) ||
          m.school?.toLowerCase().includes(s) ||
          m.major?.toLowerCase().includes(s)
        );
      })
    : null;

  const grouped = useMemo(() => {
    if (!filtered) return null;
    const map = new Map<string, ApprovedMentor[]>();
    for (const m of filtered) {
      const key = m.school || "未填写学校";
      const arr = map.get(key);
      if (arr) arr.push(m);
      else map.set(key, [m]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const PATH_LABEL: Record<string, string> = {
    postgrad_domestic: "保研/直博",
    study_abroad: "出国留学",
    kaoyan: "国内考研",
    employment: "直接就业",
    civil_exam: "考公/考编",
    gap_other: "Gap/其它",
  };

  const [exporting, setExporting] = useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const r = await apiGet<{ mentors: ExportMentor[] }>("/api/admin/mentors/export");
      const all = r.mentors;
      if (all.length === 0) { alert("暂无数据"); return; }

      const rows = all.map((m) => {
        const card = (m.introCard || {}) as IntroCard;
        const se = card.schoolEval || {};
        const pe = card.personalExp || {};
        const bt = (v: BoolText | undefined) =>
          v ? (v.had ? v.text || "有(未填详情)" : "") : "";
        return {
          "姓名": m.name || "",
          "邮箱": m.email || "",
          "学校": m.school || "",
          "院系": m.college || "",
          "专业": m.major || "",
          "年级": m.year || "",
          "高中": m.highSchool || "",
          "方向": m.majorCategory || "",
          "化名": card.displayInitial && card.displayTitle
            ? `${card.displayInitial}${card.displayTitle}` : "",
          "评分": Number(m.ratingAvg).toFixed(1),
          "评价数": m.reviewsCount,
          "标签": m.tags?.join("、") || "",
          "自我介绍": m.bio || "",
          "评价-职业规划引导": se.career?.note || "",
          "评价-教学质量": se.teaching?.note || "",
          "评价-就读体验": se.life?.note || "",
          "评价-人文关怀": se.care?.note || "",
          "评价-实践机会": se.practice?.note || "",
          "评价-优势": se.pros || "",
          "评价-不足": se.cons || "",
          "当前路径": pe.paths?.map((p: string) => PATH_LABEL[p] || p).join("、") || "",
          "科研": bt(pe.research),
          "实习": bt(pe.internship),
          "竞赛": bt(pe.competition),
          "综评/强基": bt(pe.zongping),
          "特殊项目/班型": bt(pe.program),
          "转专业": bt(pe.transfer),
          "经历补充": pe.supplement || "",
          "通过时间": m.reviewedAt ? formatDateTime(m.reviewedAt) : "",
          "注册时间": formatDateTime(m.createdAt),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 10 }, { wch: 24 }, { wch: 14 }, { wch: 18 },
        { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 8 },
        { wch: 10 }, { wch: 6 }, { wch: 6 }, { wch: 20 },
        { wch: 30 },
        { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
        { wch: 30 }, { wch: 30 },
        { wch: 20 },
        { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 },
        { wch: 30 },
        { wch: 18 }, { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "学长学姐");
      XLSX.writeFile(wb, `学长学姐_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const toggleCollapse = (school: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });
  };

  const renderMentorRow = (m: ApprovedMentor) => (
    <tr key={m.userId}>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer" }}>
        <div style={{ fontWeight: 500 }}>{m.name || "—"}</div>
        <div style={{ fontSize: 12, color: "#9a9a93", marginTop: 2 }}>
          {m.email}
        </div>
      </td>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer" }}>
        <div>{m.school || "—"}</div>
        <div style={{ fontSize: 12, color: "#9a9a93", marginTop: 2 }}>
          {m.college || "—"}
        </div>
      </td>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer" }}>
        <div>{m.major || "—"}</div>
        <div style={{ fontSize: 12, color: "#9a9a93", marginTop: 2 }}>
          {m.year || "—"}
        </div>
      </td>
      <td style={{ position: "relative" }}>
        {editingCat === m.userId ? (
          <select
            autoFocus
            defaultValue={m.majorCategory || ""}
            onChange={(e) => saveCategory(m.userId, e.target.value || null)}
            onBlur={() => setEditingCat(null)}
            className={styles.select}
            style={{ fontSize: 12, padding: "4px 6px", width: 90 }}
          >
            <option value="">未设置</option>
            {MAJOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <span
            onClick={(e) => { e.stopPropagation(); setEditingCat(m.userId); }}
            style={{
              cursor: "pointer",
              color: m.majorCategory ? "#1f1f1f" : "#9a9a93",
              borderBottom: "1px dashed #c0bfb6",
              fontSize: 13,
            }}
          >
            {m.majorCategory || "未设置"}
          </span>
        )}
      </td>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer", fontFamily: "var(--serif)" }}>
        {Number(m.ratingAvg).toFixed(1)}
        <span style={{ color: "#9a9a93", fontSize: 12, marginLeft: 4 }}>
          ({m.reviewsCount})
        </span>
      </td>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer" }}>
        {m.tags && m.tags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {m.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className={`${styles.pill} ${styles.pillNeutral}`}
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: "#9a9a93" }}>—</span>
        )}
      </td>
      <td onClick={() => openDetail(m.userId)} style={{ cursor: "pointer", color: "#6e6e68" }}>{formatDateTime(m.reviewedAt)}</td>
    </tr>
  );

  return (
    <>
      <div className={styles.topbar}>
        <span>后台</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>学长学姐</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>已通过审核的学长学姐</h1>
        <p className={styles.pageSub}>
          {mentors === null
            ? "加载中…"
            : `共 ${mentors.length} 位，可按姓名 / 邮箱 / 学校 / 专业搜索`}
        </p>

        {err && (
          <div className={styles.alertBad} style={{ marginBottom: 16 }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 320, flex: 1 }}>
            <input
              type="search"
              placeholder="搜索…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={styles.input}
            />
          </div>
          <button
            onClick={exportExcel}
            disabled={exporting || !mentors || mentors.length === 0}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              background: "#1f1f1f",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: exporting || !mentors || mentors.length === 0 ? "not-allowed" : "pointer",
              opacity: exporting || !mentors || mentors.length === 0 ? 0.4 : 1,
              fontFamily: "inherit",
            }}
          >
            {exporting ? "导出中…" : "导出 Excel"}
          </button>
          <div style={{ display: "flex", border: "1px solid #e0dfd8", borderRadius: 7, overflow: "hidden" }}>
            <button
              onClick={() => setView("list")}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                background: view === "list" ? "#1f1f1f" : "#fff",
                color: view === "list" ? "#fff" : "#4a4a45",
              }}
            >
              列表
            </button>
            <button
              onClick={() => setView("school")}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                border: "none",
                borderLeft: "1px solid #e0dfd8",
                cursor: "pointer",
                fontFamily: "inherit",
                background: view === "school" ? "#1f1f1f" : "#fff",
                color: view === "school" ? "#fff" : "#4a4a45",
              }}
            >
              按学校
            </button>
          </div>
        </div>

        {mentors === null ? (
          <div className={styles.emptyState}>加载中…</div>
        ) : filtered && filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {mentors.length === 0 ? "暂无已通过审核的学长学姐。" : "没有匹配的记录。"}
          </div>
        ) : view === "list" ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>姓名</th>
                <th>学校 / 院系</th>
                <th>专业 / 年级</th>
                <th>方向</th>
                <th>评分</th>
                <th>标签</th>
                <th>通过时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered!.map(renderMentorRow)}
            </tbody>
          </table>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {grouped!.map(([school, members]) => {
              const isCollapsed = collapsed.has(school);
              return (
                <div key={school} className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    onClick={() => toggleCollapse(school)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px",
                      cursor: "pointer",
                      background: "#fafaf7",
                      borderBottom: isCollapsed ? "none" : "1px solid #ececec",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        display: "inline-block",
                        width: 20,
                        textAlign: "center",
                        fontSize: 12,
                        color: "#9a9a93",
                        transition: "transform 0.15s ease",
                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      }}>
                        ▼
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 15, fontFamily: "var(--serif)" }}>
                        {school}
                      </span>
                    </div>
                    <span className={`${styles.pill} ${styles.pillNeutral}`}>
                      {members.length} 人
                    </span>
                  </div>
                  {!isCollapsed && (
                    <table className={styles.table} style={{ border: "none", borderRadius: 0 }}>
                      <thead>
                        <tr>
                          <th>姓名</th>
                          <th>学校 / 院系</th>
                          <th>专业 / 年级</th>
                          <th>评分</th>
                          <th>标签</th>
                          <th>通过时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(renderMentorRow)}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(detail || detailLoading || detailErr) && (
        <div
          onClick={() => {
            if (!detailLoading) {
              setDetail(null);
              setDetailErr(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "#fff",
              height: "100%",
              overflowY: "auto",
              padding: "24px 32px",
              boxShadow: "-4px 0 16px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <h1 className={styles.pageTitle} style={{ margin: 0 }}>
                {detail?.name || (detailLoading ? "加载中…" : "学长详情")}
              </h1>
              <button
                onClick={() => {
                  setDetail(null);
                  setDetailErr(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#9a9a93",
                  padding: "0 4px",
                }}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            {detail && (
              <p className={styles.pageSub}>
                {detail.email} · 评分 {Number(detail.ratingAvg).toFixed(1)} ({detail.reviewsCount})
                {detail.reviewedAt && ` · 通过于 ${formatDateTime(detail.reviewedAt)}`}
              </p>
            )}
            {detailErr && <div className={styles.alertBad}>{detailErr}</div>}
            {detail && <MentorProfileView mentor={detail} />}
            {detailLoading && (
              <div className={styles.emptyState} style={{ marginTop: 24 }}>
                加载中…
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
