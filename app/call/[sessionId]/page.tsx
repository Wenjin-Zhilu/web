"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import * as zego from "@/lib/zego";
import * as callRecorder from "@/lib/call-recorder";
import styles from "./call.module.css";

type CallState = "loading" | "waiting" | "active" | "countdown" | "ended";
type PeerInfo =
  | {
      kind: "mentor";
      name?: string | null;
      school?: string | null;
      college?: string | null;
      major?: string | null;
      year?: string | null;
      highSchool?: string | null;
    }
  | {
      kind: "parent";
      name?: string | null;
      parentRole?: string | null;
      province?: string | null;
      stage?: string | null;
      highSchool?: string | null;
      intendedMajors?: string[] | null;
      tilt?: string | null;
    };
type CallTokenResponse = {
  token: string;
  roomID: string;
  userID: string;
  peerUserID: string;
  peerName?: string;
  appID: number;
  durationMins: number;
  extendedMins?: number;
  endsAtMs?: number | null;
  isMentor?: boolean;
  peerInfo?: PeerInfo | null;
  orderId: string | null;
};

const MAX_EXTEND_MINS = 30;
const ROLE_LABEL: Record<string, string> = {
  student: "学生",
  parent: "家长",
  teacher: "老师",
  other: "其他",
};
const STAGE_LABEL: Record<string, string> = {
  senior_pre: "高三 · 考前",
  senior_post: "高三 · 考后",
  g10_g11: "高一 / 高二",
  gap: "复读 / 间隔年",
  other: "其他",
};
const TILT_LABEL: Record<string, string> = {
  employment: "倾向就业",
  grad_school: "倾向升学读研",
  overseas: "倾向出国",
  experience: "重视体验探索",
  undecided: "尚未确定",
};

function peerInfoLines(p: PeerInfo | null): string[] {
  if (!p) return [];
  const lines: string[] = [];
  if (p.kind === "mentor") {
    const main = [p.school, p.college, p.major, p.year].filter(Boolean).join(" · ");
    if (main) lines.push(main);
    if (p.highSchool) lines.push(`高中：${p.highSchool}`);
  } else {
    const id = [
      p.parentRole ? ROLE_LABEL[p.parentRole] : null,
      p.stage ? STAGE_LABEL[p.stage] : null,
    ]
      .filter(Boolean)
      .join(" · ");
    if (id) lines.push(id);
    const loc = [p.province, p.highSchool].filter(Boolean).join(" · ");
    if (loc) lines.push(loc);
    if (p.intendedMajors && p.intendedMajors.length) {
      lines.push(`意向专业：${p.intendedMajors.join("、")}`);
    }
    if (p.tilt && TILT_LABEL[p.tilt]) lines.push(TILT_LABEL[p.tilt]);
  }
  return lines;
}

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { data: session, isPending } = useSession();
  const [callState, setCallState] = useState<CallState>("loading");
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [extendedMins, setExtendedMins] = useState(0);
  const [extending, setExtending] = useState(false);
  const [peerName, setPeerName] = useState("");
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
  const [recording, setRecording] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtMsRef = useRef<number | null>(null);
  const roomIdRef = useRef("");
  const orderIdRef = useRef<string | null>(null);
  const lastSeenEndedAtRef = useRef<string | null>(null);
  const endedRef = useRef(false);
  const callStartedRef = useRef(false);
  const startReportInFlightRef = useRef(false);
  const startReportSentRef = useRef(false);
  const recordingRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/auth?mode=login");
    }
  }, [session, isPending, router]);

  const endCall = useCallback(async (options?: { reportEnd?: boolean }) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const shouldReportEnd = options?.reportEnd ?? true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }

    const recordingBlob = await callRecorder.stopRecording();
    setRecording(false);

    try {
      await zego.leaveRoom(roomIdRef.current);
    } catch (error) {
      console.error(error);
    } finally {
      zego.destroy();
    }

    if (shouldReportEnd) {
      try {
        await fetch("/api/call/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error(error);
      }
    }

    if (recordingBlob && recordingBlob.size > 0) {
      const form = new FormData();
      form.append("audio", recordingBlob, `call_${sessionId}.webm`);
      form.append("sessionId", sessionId);
      fetch("/api/call/upload-recording", {
        method: "POST",
        credentials: "include",
        body: form,
      }).catch((err) => console.error("upload recording failed", err));
    }

    if (orderIdRef.current) {
      router.replace(`/dashboard/orders/${orderIdRef.current}`);
    } else {
      setCallState("ended");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (isPending || !session) return;

    let cancelled = false;
    endedRef.current = false;
    callStartedRef.current = false;
    startReportInFlightRef.current = false;
    startReportSentRef.current = false;

    async function init() {
      const res = await fetch(`/api/call/token?sessionId=${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        router.replace("/dashboard");
        return;
      }
      const data = (await res.json()) as CallTokenResponse;
      if (cancelled) return;

      roomIdRef.current = data.roomID;
      orderIdRef.current = data.orderId;
      endsAtMsRef.current = data.endsAtMs ?? null;
      lastSeenEndedAtRef.current = null;
      setElapsed(0);
      setExtendedMins(data.extendedMins ?? 0);
      setRemaining(null);
      setPeerName(data.peerName || data.peerInfo?.name || "对方");
      setPeerInfo(data.peerInfo ?? null);

      await zego.createEngine(data.appID);
      if (cancelled) return;

      const tryStartRecording = () => {
        if (callRecorder.isRecording() || endedRef.current) return;
        const localS = zego.getLocalStream();
        const remoteS = zego.getRemoteStream();
        if (localS && remoteS) {
          callRecorder.startRecording(localS, remoteS);
          setRecording(true);
        } else if (!recordingRetryRef.current) {
          recordingRetryRef.current = setTimeout(() => {
            recordingRetryRef.current = null;
            tryStartRecording();
          }, 1000);
        }
      };

      const startCall = async () => {
        if (cancelled || endedRef.current) return;

        if (!callStartedRef.current) {
          callStartedRef.current = true;
          setCallState("active");

          const startTime = Date.now();
          timerRef.current = setInterval(() => {
            const secs = Math.floor((Date.now() - startTime) / 1000);
            setElapsed(secs);

            // 优先用服务端权威结束时间（含学长延时）；无 slot 的通话回退到本地时长
            let remain: number;
            if (endsAtMsRef.current != null) {
              remain = Math.ceil((endsAtMsRef.current - Date.now()) / 1000);
            } else {
              remain = data.durationMins * 60 - secs;
            }
            setRemaining(remain);
            if (remain <= 0) {
              void endCall();
            }
          }, 1000);
        }

        tryStartRecording();

        if (startReportSentRef.current || startReportInFlightRef.current) return;

        startReportInFlightRef.current = true;
        try {
          const startedRes = await fetch("/api/call/started", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sessionId }),
          });
          if (!startedRes.ok) {
            throw new Error("Failed to mark call as started");
          }
          startReportSentRef.current = true;
        } catch (error) {
          console.error(error);
        } finally {
          startReportInFlightRef.current = false;
        }
      };

      zego.onRoomStreamUpdate((type) => {
        if (type === "ADD") void startCall();
      });

      zego.onRoomUserUpdate(async (type, userList) => {
        if (type === "ADD" && !cancelled) {
          if (userList.length > 0) {
            setPeerName(userList[0].userName ?? "对方");
          }
          void startCall();
        }
      });

      statusPollRef.current = setInterval(async () => {
        if (cancelled || endedRef.current) return;
        try {
          const statusRes = await fetch(`/api/call/status/${sessionId}`, {
            credentials: "include",
          });
          if (!statusRes.ok) return;
          const statusData = (await statusRes.json()) as {
            status: "pending" | "active" | "ended";
            endedAt: string | null;
            endsAtMs?: number | null;
            extendedMins?: number;
          };
          // 学长延时后，家长端在这里同步到新的结束时间（≤2s）
          if (statusData.endsAtMs != null) {
            endsAtMsRef.current = statusData.endsAtMs;
          }
          if (typeof statusData.extendedMins === "number") {
            setExtendedMins(statusData.extendedMins);
          }
          // 服务端因超时把 session 标 ended → 双方都下线
          if (statusData.status === "ended") {
            void endCall({ reportEnd: false });
            return;
          }
          // 对方主动挂断 → endedAt 是一个本端没见过的时间戳 → 本端也离开
          if (statusData.endedAt && lastSeenEndedAtRef.current !== statusData.endedAt) {
            lastSeenEndedAtRef.current = statusData.endedAt;
            void endCall({ reportEnd: false });
          }
        } catch (error) {
          console.error(error);
        }
      }, 2000);

      const u = session!.user as { name?: string; email?: string };
      const userName = u.name || u.email || "用户";
      setCallState("waiting");
      await zego.joinRoom(data.token, data.roomID, data.userID, userName, data.peerUserID);
      if (cancelled) {
        await zego.leaveRoom(data.roomID);
        zego.destroy();
      }
    }

    init();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusPollRef.current) clearInterval(statusPollRef.current);
      if (recordingRetryRef.current) clearTimeout(recordingRetryRef.current);
      void zego.leaveRoom(roomIdRef.current);
      zego.destroy();
    };
  }, [isPending, session, sessionId, router, endCall]);

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const handleExtend = async () => {
    if (extending) return;
    setExtending(true);
    try {
      const res = await fetch("/api/call/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, addMins: 5 }),
      });
      const d = await res.json();
      if (res.ok && d.endsAtMs != null) {
        endsAtMsRef.current = d.endsAtMs;
      }
      if (typeof d.extendedMins === "number") {
        setExtendedMins(d.extendedMins);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExtending(false);
    }
  };

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isMentor = user?.role === "mentor";
  const avatarBg = isMentor ? "#b8472d" : "#3d5c4d";
  const avatarLetter = peerName ? peerName[0] : "?";

  if (isPending || !session) {
    return <div className={styles.page}><div className={styles.loading}>加载中...</div></div>;
  }

  if (callState === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>连接中...</span>
        </div>
      </div>
    );
  }

  if (callState === "ended") {
    return (
      <div className={styles.page}>
        <div className={styles.endedIcon}>&#10003;</div>
        <h2 className={styles.endedTitle}>通话已结束</h2>
        <p className={styles.endedDuration}>本次通话时长：{formatTime(elapsed)}</p>
        <p className={styles.endedNote}>通话记录生成中...</p>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
          返回首页
        </button>
      </div>
    );
  }

  if (callState === "waiting") {
    return (
      <div className={styles.page}>
        <div className={`${styles.avatar} ${styles.avatarWaiting}`} style={{ background: avatarBg }}>
          {avatarLetter}
        </div>
        <h2 className={styles.userName}>{peerName || "对方"}</h2>
        <p className={styles.waitingText}>等待对方加入...</p>
        <div className={styles.spinner} />
        <button className={styles.cancelBtn} onClick={() => void endCall()}>
          取消
        </button>
      </div>
    );
  }

  const lines = peerInfoLines(peerInfo);
  const lowTime = remaining != null && remaining <= 300;

  return (
    <div className={styles.page}>
      {remaining != null ? (
        <div className={`${styles.timer} ${lowTime ? styles.timerWarning : ""}`}>
          剩余时间 <span className={styles.timerValue}>{formatTime(Math.max(0, remaining))}</span>
          {extendedMins > 0 && (
            <span className={styles.extendNote}>（含延时 {extendedMins} 分钟）</span>
          )}
        </div>
      ) : (
        <div className={styles.timer}>{formatTime(elapsed)}</div>
      )}

      <div className={styles.avatar} style={{ background: avatarBg }}>{avatarLetter}</div>
      <h2 className={styles.userName}>{peerName || "对方"}</h2>
      {lines.length > 0 ? (
        <div className={styles.peerCard} style={{ borderLeftColor: avatarBg }}>
          {lines.map((l, i) => (
            <p key={i} className={styles.peerLine}>{l}</p>
          ))}
        </div>
      ) : (
        <p className={styles.userDetail}>对方暂未完善资料</p>
      )}
      <div>
        <span className={styles.statusDot} />
        <span className={styles.statusText}>通话中</span>
      </div>

      {recording && (
        <div className={styles.recordingBadge}>
          <span className={styles.recordingDot} />
          平台录音中
        </div>
      )}

      <div className={styles.controls}>
        {isMentor && (
          <button
            className={`${styles.controlBtn} ${styles.extendBtn}`}
            onClick={() => void handleExtend()}
            disabled={extending || extendedMins >= MAX_EXTEND_MINS}
            title={extendedMins >= MAX_EXTEND_MINS ? "已达延时上限" : "延时 5 分钟"}
          >
            +5′
          </button>
        )}
        <button
          className={`${styles.controlBtn} ${styles.hangupBtn}`}
          onClick={() => void endCall()}
          title="挂断"
        >
          📞
        </button>
      </div>
    </div>
  );
}
