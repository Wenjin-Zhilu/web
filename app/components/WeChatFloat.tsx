"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./WeChatFloat.module.css";

export default function WeChatFloat({ accent = "#b8472d" }: { accent?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={styles.wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div className={styles.card}>
          <Image
            className={styles.qr}
            src="/wechat-qr.jpg"
            alt="问津企业微信二维码"
            width={240}
            height={240}
            unoptimized
          />
          <p className={styles.label}>微信联系我们</p>
          <p className={styles.sub}>扫码添加企业微信</p>
        </div>
      )}
      <button
        className={styles.btn}
        style={{ "--wechat-bg": accent } as React.CSSProperties}
        onClick={() => setOpen((v) => !v)}
        aria-label="微信联系我们"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 0 1-.253-1.726c0-3.573 3.263-6.467 7.3-6.467.258 0 .513.013.768.037C16.558 4.968 12.949 2.188 8.691 2.188zM5.785 5.991a1.128 1.128 0 1 1 0 2.256 1.128 1.128 0 0 1 0-2.256zm5.813 0a1.128 1.128 0 1 1 0 2.256 1.128 1.128 0 0 1 0-2.256zm4.45 3.806c-3.48 0-6.306 2.467-6.306 5.51 0 3.044 2.826 5.51 6.306 5.51.596 0 1.175-.073 1.733-.213a.666.666 0 0 1 .553.075l1.467.858a.25.25 0 0 0 .129.041.228.228 0 0 0 .223-.227c0-.055-.022-.11-.037-.163l-.3-1.14a.457.457 0 0 1 .164-.512c1.413-1.04 2.316-2.573 2.316-4.28 0-3.042-2.826-5.509-6.249-5.509zm-2.42 3.284a.868.868 0 1 1 0 1.736.868.868 0 0 1 0-1.736zm4.84 0a.868.868 0 1 1 0 1.736.868.868 0 0 1 0-1.736z" />
        </svg>
        <span className={styles.btnText}>微信沟通</span>
      </button>
    </div>
  );
}
