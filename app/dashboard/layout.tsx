"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parentAuthClient, mentorAuthClient } from "@/lib/auth-client";
import { Sidebar } from "./_components/Sidebar";
import UpcomingCallModal from "./_components/UpcomingCallModal";
import PendingInquiryModal from "./_components/PendingInquiryModal";
import PendingPaymentModal from "./_components/PendingPaymentModal";
import styles from "./dashboard.module.css";
import WeChatFloat from "../components/WeChatFloat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: parentSession, isPending: parentPending } = parentAuthClient.useSession();
  const { data: mentorSession, isPending: mentorPending } = mentorAuthClient.useSession();

  const isPending = parentPending || mentorPending;
  const session = mentorSession || parentSession;

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/auth?mode=login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div className={styles.loading}>加载中…</div>;
  }
  if (!session) {
    return null;
  }

  const user = session.user as { name?: string; email?: string; role?: string };
  const role = (user.role as "parent" | "mentor") || "parent";
  const accent = role === "mentor" ? "#3d5c4d" : "#b8472d";
  const side = role === "mentor" ? "指路" : "问津";

  return (
    <div className={styles.shell}>
      <Sidebar role={role} name={user.name || ""} email={user.email || ""} accent={accent} side={side} />
      <div className={styles.main} style={{ ["--accent" as string]: accent } as React.CSSProperties}>
        {children}
      </div>
      <WeChatFloat accent={accent} />
      <UpcomingCallModal />
      <PendingInquiryModal />
      <PendingPaymentModal />
    </div>
  );
}
