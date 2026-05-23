import Link from "next/link";
import styles from "./questions.module.css";
import pageStyles from "../page.module.css";

const GROUPS = [
  {
    tag: "高一 / 高二",
    title: "提前了解专业方向",
    desc: "适合刚开始关心方向，但还没具体目标的家庭。",
    items: [
      "孩子对计算机感兴趣，但数学一般，适合吗？",
      "电子信息、自动化、计算机到底有什么区别？",
      "法学、金融、医学这些专业实际学什么？",
      "高中阶段要不要提前准备竞赛、科研、语言或综评？",
    ],
  },
  {
    tag: "已有专业倾向",
    title: "几个专业之间怎么选",
    desc: "适合已经有若干专业倾向，但无法判断适配度的家庭。",
    items: [
      "这个专业实际学什么？和想象中一样吗？",
      "几个相近专业到底差在哪？",
      "孩子适不适合这个专业？",
      "什么样的学生读了容易后悔？",
    ],
  },
  {
    tag: "分数段相近",
    title: "几所大学之间怎么比",
    desc: "适合分数段相近、学校选择难以取舍的家庭。",
    items: [
      "A 校和 B 校同类专业真实差异在哪里？",
      "这所学校学习氛围是偏卷还是偏自由？",
      "学院资源、课程压力和学生状态怎么样？",
      "城市、校园环境会不会影响孩子适应？",
    ],
  },
  {
    tag: "高三填报前",
    title: "分数擦边，要不要冲",
    desc: "适合高三填报前需要权衡冲稳保的家庭。",
    items: [
      "分数接近目标院校录取线，要不要冲？",
      "压线进去后，学习压力会不会太大？",
      "冲学校和稳专业之间怎么取舍？",
      "调剂到不熟悉专业怎么办？",
    ],
  },
  {
    tag: "看长远",
    title: "未来路径通常怎么走",
    desc: "适合希望了解后续升学、就业方向和准备节奏的家庭。",
    items: [
      "保研、考研、出国分别是什么情况？",
      "转专业难不难？",
      "实习、科研、竞赛机会多吗？",
      "就业方向可以了解，但应该问谁更靠谱？",
    ],
  },
];

export default function QuestionsPage() {
  return (
    <div className={pageStyles.shell}>
      <header className={pageStyles.nav}>
        <div className={pageStyles.brand}>
          <Link href="/" className={styles.brandLink}>
            <div className={pageStyles.brandLogo}>津</div>
            <span className={pageStyles.brandText}>问津</span>
            <span className={pageStyles.brandSub}>FOR FAMILIES</span>
          </Link>
        </div>
        <nav className={pageStyles.navLinks}>
          <Link href="/#why">为什么需要问津</Link>
          <Link href="/#how">如何参与</Link>
          <Link href="/questions">家长都在问</Link>
          <Link href="/auth?mode=login">登录</Link>
          <Link href="/auth" className={pageStyles.navBtn}>
            看看能问谁
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.head}>
          <div className={styles.headInner}>
            <div className={styles.crumb}>
              <Link href="/">← 返回首页</Link>
            </div>
            <h1 className={styles.headTitle}>家长都在问什么？</h1>
            <p className={styles.headSub}>
              从高一高二的方向探索，到高三填报前的最终取舍，这些都是高中家庭最常见的真实疑问。
              不需要把问题想得完整，先看看哪一类最贴近您此刻的处境。
            </p>
            <div className={styles.headCta}>
              <Link href="/auth" className={pageStyles.btnPrimary}>
                我也想问类似问题 <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.bodyInner}>
            {GROUPS.map((g) => (
              <article key={g.title} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.groupTag}>{g.tag}</span>
                  <h2 className={styles.groupTitle}>{g.title}</h2>
                  <p className={styles.groupDesc}>{g.desc}</p>
                </div>
                <ul className={styles.groupList}>
                  {g.items.map((it) => (
                    <li key={it} className={styles.groupItem}>
                      <span className={styles.groupItemDot} />
                      {it}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={pageStyles.finalCta}>
          <div className={pageStyles.finalCtaInner}>
            <h2 className={pageStyles.finalCtaTitle}>
              有类似问题？
              <br />
              告诉我们孩子的阶段和<span className={pageStyles.heroAccent}>纠结点</span>。
            </h2>
            <p className={pageStyles.finalCtaSub}>
              注册后按学校和专业浏览学长学姐，看到合适的再付费。
            </p>
            <Link href="/auth" className={pageStyles.btnPrimary}>
              看看能问谁 <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={pageStyles.footer}>
        <div className={pageStyles.footerBottom} style={{ marginTop: 0, borderTop: "none" }}>
          <div>© 2026 问津 · 指路</div>
          <div>在他们读过的路上，问一次清楚</div>
        </div>
      </footer>
    </div>
  );
}
