"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, ApiError, formatDateTime } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import styles from "../dashboard.module.css";

type Slot = {
  id: string;
  startAt: string;
  durationMins: number;
  status: "open" | "booked" | "cancelled";
};

const accent = "#3d5c4d";

// 半小时网格：白天 07:00 → 24:00（默认显示），凌晨 00:00 → 07:00（默认折叠）
const DAY_START = 7;
const NIGHT_END = 7; // 凌晨段 0..NIGHT_END
const STEP_MINS = 30;
const DAYS_AHEAD = 14;

function toLocalISO(date: Date): string {
  // 输出本地时区的 ISO（不带 Z），后端用 new Date() 解析后比较毫秒；
  // 这里实际上发送时改回 UTC ISO 更安全。
  return date.toISOString();
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildHourRange(day: Date, hStart: number, hEnd: number): Date[] {
  const out: Date[] = [];
  for (let h = hStart; h < hEnd; h++) {
    for (let m = 0; m < 60; m += STEP_MINS) {
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      out.push(d);
    }
  }
  return out;
}

export default function SlotsPage() {
  const { data: session } = authClient.useSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // 本次会话内的待新增 / 待删除
  const [toAdd, setToAdd] = useState<Set<string>>(new Set()); // ISO strings
  const [toRemove, setToRemove] = useState<Set<string>>(new Set()); // slot ids
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await apiGet<{ slots: Slot[] }>("/api/mentors/me/slots");
      setSlots(r.slots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    reload();
  }, [session]);

  const days = useMemo(() => {
    const out: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  // 当天的 30 分钟时间格
  const dayCells = useMemo(() => buildHourRange(selectedDay, DAY_START, 24), [selectedDay]);
  const nightCells = useMemo(() => buildHourRange(selectedDay, 0, NIGHT_END), [selectedDay]);
  const [showNight, setShowNight] = useState(false);

  // 已存在的 open/booked slot 索引：iso → slot
  const existingByIso = useMemo(() => {
    const m = new Map<string, Slot>();
    for (const s of slots) {
      if (s.status === "cancelled") continue;
      m.set(new Date(s.startAt).toISOString(), s);
    }
    return m;
  }, [slots]);

  const slotState = (cellDate: Date) => {
    const iso = cellDate.toISOString();
    const existing = existingByIso.get(iso);
    if (existing) {
      if (existing.status === "booked") return { kind: "booked" as const, slot: existing };
      if (toRemove.has(existing.id)) return { kind: "toRemove" as const, slot: existing };
      return { kind: "open" as const, slot: existing };
    }
    if (cellDate.getTime() <= Date.now()) return { kind: "past" as const };
    if (toAdd.has(iso)) return { kind: "toAdd" as const };
    return { kind: "empty" as const };
  };

  const toggleCell = (cellDate: Date) => {
    const iso = cellDate.toISOString();
    const st = slotState(cellDate);
    if (st.kind === "past" || st.kind === "booked") return;
    if (st.kind === "empty") {
      const next = new Set(toAdd);
      next.add(iso);
      setToAdd(next);
    } else if (st.kind === "toAdd") {
      const next = new Set(toAdd);
      next.delete(iso);
      setToAdd(next);
    } else if (st.kind === "open") {
      const next = new Set(toRemove);
      next.add(st.slot.id);
      setToRemove(next);
    } else if (st.kind === "toRemove") {
      const next = new Set(toRemove);
      next.delete(st.slot.id);
      setToRemove(next);
    }
  };

  const hasChanges = toAdd.size > 0 || toRemove.size > 0;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      if (toRemove.size > 0) {
        await apiSend("/api/mentors/me/slots", "DELETE", { ids: Array.from(toRemove) });
      }
      if (toAdd.size > 0) {
        const payload = Array.from(toAdd).map((iso) => ({ startAt: iso, durationMins: 30 }));
        const r = await apiSend<{ created: Slot[]; conflicts: Array<{ startAt: string; reason: string }> }>(
          "/api/mentors/me/slots",
          "POST",
          { slots: payload }
        );
        if (r.conflicts.length > 0) {
          setMsg({
            kind: "err",
            text: `部分时段未保存：${r.conflicts.map((c) => `${formatDateTime(c.startAt)}（${c.reason}）`).join("； ")}`,
          });
        } else {
          setMsg({ kind: "ok", text: `已保存：新增 ${r.created.length}，删除 ${toRemove.size}` });
        }
      } else {
        setMsg({ kind: "ok", text: `已删除 ${toRemove.size} 个时段` });
      }
      setToAdd(new Set());
      setToRemove(new Set());
      await reload();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setToAdd(new Set());
    setToRemove(new Set());
    setMsg(null);
  };

  return (
    <>
      <div className={styles.topbar}>
        <span>指路</span>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>时间档期</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>时间档期</h1>
        <p className={styles.pageSub}>
          点击时间格切换开放 / 不开放。每个时段 30 分钟，保存后家长就可以预订。
        </p>
        <p style={{ marginTop: 8, color: "#b8472d", fontSize: 13 }}>
          请为自己开放的时段负责：一旦被家长预订，将无法取消。
        </p>

        {msg && (
          <div className={msg.kind === "ok" ? styles.alertOk : styles.alertBad} style={{ marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        <Legend accent={accent} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, marginTop: 16 }}>
          {days.map((d) => {
            const isSelected = dayKey(d) === dayKey(selectedDay);
            const isToday = dayKey(d) === dayKey(new Date());
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDay(d)}
                style={{
                  flex: "0 0 auto",
                  padding: "8px 10px",
                  border: "1px solid " + (isSelected ? accent : "#ececec"),
                  borderRadius: 7,
                  background: isSelected ? accent : "#fff",
                  color: isSelected ? "#fff" : "#1f1f1f",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  textAlign: "center",
                  minWidth: 56,
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.8 }}>
                  {["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}
                  {isToday && " · 今"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1, fontFamily: "var(--serif)" }}>
                  {d.getMonth() + 1}/{d.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className={styles.emptyState}>加载中…</div>
        ) : (
          <>
            <SlotGrid cells={dayCells} slotState={slotState} toggleCell={toggleCell} accent={accent} />

            <button
              onClick={() => setShowNight((v) => !v)}
              style={{
                marginTop: 18,
                background: "transparent",
                border: "none",
                color: "#6e6e68",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "6px 0",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ transition: "transform 0.15s", transform: showNight ? "rotate(90deg)" : "rotate(0)" }}>
                ›
              </span>
              凌晨时段（00:00 – 07:00）{showNight ? "" : "· 默认折叠"}
            </button>

            {showNight && (
              <div style={{ marginTop: 12 }}>
                <SlotGrid cells={nightCells} slotState={slotState} toggleCell={toggleCell} accent={accent} />
              </div>
            )}
          </>
        )}

        <div className={styles.section} style={{ display: "flex", gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={reset} disabled={!hasChanges || saving}>
            重置
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ background: accent }}
            onClick={save}
            disabled={!hasChanges || saving}
          >
            {saving
              ? "保存中…"
              : `保存（新增 ${toAdd.size}，删除 ${toRemove.size}）`}
          </button>
        </div>
      </div>
    </>
  );
}

function SlotGrid({
  cells,
  slotState,
  toggleCell,
  accent,
}: {
  cells: Date[];
  slotState: (d: Date) => { kind: "empty" | "open" | "booked" | "past" | "toAdd" | "toRemove"; slot?: Slot };
  toggleCell: (d: Date) => void;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 8,
        maxWidth: 720,
      }}
    >
      {cells.map((cell) => {
        const st = slotState(cell);
        const label = `${String(cell.getHours()).padStart(2, "0")}:${String(cell.getMinutes()).padStart(2, "0")}`;
        const style = cellStyle(st.kind, accent);
        const disabled = st.kind === "past" || st.kind === "booked";
        return (
          <button
            key={cell.toISOString()}
            onClick={() => toggleCell(cell)}
            disabled={disabled}
            style={{
              ...style,
              padding: "10px 0",
              fontFamily: "inherit",
              fontSize: 14,
              cursor: disabled ? "not-allowed" : "pointer",
              borderRadius: 6,
            }}
            title={
              st.kind === "booked"
                ? "该时段已有订单，不能修改"
                : st.kind === "past"
                  ? "已过期"
                  : ""
            }
          >
            {label}
            {st.kind === "booked" && <span style={{ fontSize: 10, display: "block", marginTop: 2 }}>已预订</span>}
          </button>
        );
      })}
    </div>
  );
}

function cellStyle(
  kind: "empty" | "open" | "booked" | "past" | "toAdd" | "toRemove",
  accent: string
): React.CSSProperties {
  switch (kind) {
    case "empty":
      return { background: "#fff", border: "1px solid #ececec", color: "#4a4a45" };
    case "open":
      return { background: accent, border: "1px solid " + accent, color: "#fff" };
    case "booked":
      return { background: "#fdf5e7", border: "1px solid #f0e2bf", color: "#976912" };
    case "past":
      return { background: "#f5f4ee", border: "1px solid #ececec", color: "#c0bfb6" };
    case "toAdd":
      return {
        background: "#fff",
        border: "2px dashed " + accent,
        color: accent,
        fontWeight: 600,
      };
    case "toRemove":
      return {
        background: "#fbeee9",
        border: "1px solid #f0cfc2",
        color: "#a4391a",
        textDecoration: "line-through",
      };
  }
}

function Legend({ accent }: { accent: string }) {
  const items: { kind: "empty" | "open" | "booked" | "toAdd" | "toRemove"; label: string }[] = [
    { kind: "empty", label: "未开放" },
    { kind: "open", label: "已开放" },
    { kind: "booked", label: "已预订" },
    { kind: "toAdd", label: "本次新增" },
    { kind: "toRemove", label: "本次删除" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#6e6e68" }}>
      {items.map((it) => (
        <div key={it.kind} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 4,
              ...cellStyle(it.kind, accent),
            }}
          />
          {it.label}
        </div>
      ))}
    </div>
  );
}

// 兼容旧引用
void toLocalISO;
