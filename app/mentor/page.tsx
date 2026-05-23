import Link from "next/link";
import styles from "./mentor.module.css";

const STATS = [
  {
    big: "79%",
    copy: "受访大学生表示曾想过转专业，其中 60% 是因为本专业发展前景不及预期。",
    src: "中国青年报 · 2,002 人调查 (2016)",
  },
  {
    big: "79.5%",
    copy: "学生在填报志愿时感到迷茫，主因是对自己喜好不明确、对专业了解有限。",
    src: "央视新闻 · 162 所高校 2,048 份问卷 (2023)",
  },
  {
    big: "¥20,000",
    copy: "是市面 IP 升学咨询的常见报价。其实他们最需要的，是一个真正读过这条路的人。",
    src: "央视新闻 · 2024 高考志愿填报市场调查",
  },
];

const BENEFITS = [
  {
    icon: "盾",
    title: "全程站内沟通",
    desc: "不出微信、不留私号。从筛选匹配到通话评价，所有交流都在指路完成。",
  },
  {
    icon: "约",
    title: "档期完全你定",
    desc: "你愿意接的时间段，开放即可。不愿意接的家长可以直接拒绝，平台兜底。",
  },
  {
    icon: "金",
    title: "半小时 100 起步",
    desc: "比家教省心省力。下单即冻结款项，通话完成且双向确认后结算到账。",
  },
  {
    icon: "护",
    title: "纠纷、客诉、退款 · 平台兜底",
    desc: "遇到不合理诉求或恶意投诉，平台先与家长沟通，不让你独自面对。",
  },
];

const STEPS = [
  { num: "01", title: "填一份简介", desc: "学校、专业、年级、最擅长聊的话题。两分钟。" },
  { num: "02", title: "上传在读证明", desc: "学生证 / 教务系统截图，仅用于身份核验，不公开。" },
  { num: "03", title: "等待审核", desc: "通常 24 小时内反馈。审核通过后，进入指路工作台。" },
  { num: "04", title: "开放档期", desc: "你设档期，家长根据匹配预约。完成咨询，结算到账。" },
];

const REQS = [
  {
    title: "在读身份",
    desc: "本科、硕士、博士、Gap year 在读均可。",
  },
  {
    title: "首批覆盖院校",
    desc: "清北、复交、华师、同济、上财、上外、人大、浙大、南大、中科大、港大、港中文…… 持续扩展。",
  },
  {
    title: "身份核验",
    desc: "在读证明 + 简介审核都通过后才能开始接单。所有信息平台保密。",
  },
  {
    title: "基本沟通能力",
    desc: "愿意真诚回答问题，不需要 IP、不需要漂亮话术。讲清楚自己的真实经历就够了。",
  },
];

const FAQ = [
  {
    q: "时间投入怎么算？",
    a: "一单平均 30–45 分钟通话 + 极少量准备时间。档期完全由你自己开，不想接的时段直接不放。",
  },
  {
    q: "万一遇到难缠的家长？",
    a: "全程站内通话、平台监管。出现不合理诉求、辱骂、要求加微信等情况，可以直接挂断并申请平台介入，处理结果不影响你的结算。",
  },
  {
    q: "隐私会被泄露吗？",
    a: "家长侧只能看到你的化名首字、学校、专业、年级、自述介绍。教务系统截图、真实姓名、联系方式平台不公开。",
  },
  {
    q: "什么时候开始？",
    a: "首批通话窗口 2026 年 6 月 9 日 17:00 高考结束起。学长学姐招募 5 月下旬开放，建议提前报名占名额。",
  },
];

export default function MentorLanding() {
  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>路</div>
          <span className={styles.brandText}>指路</span>
          <span className={styles.brandSub}>FOR MENTORS</span>
        </div>
        <nav className={styles.navLinks}>
          <a href="#why">为什么参与</a>
          <a href="#how">如何加入</a>
          <a href="#faq">常见问题</a>
          <Link href="/auth?role=mentor&mode=login" className={styles.navBtn}>
            登录
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>首批招募 · 5 月下旬开放</span>
            </div>
            <h1 className={styles.heroTitle}>
              用你的经验
              <br />
              帮助后来人
            </h1>
            <p className={styles.heroSub}>
              加入指路，做对口学弟学妹的领路人——用你最熟悉的话题，
              <br />
              换一份对应你时间价值的合理回报。
            </p>
            <div className={styles.heroCta}>
              <Link href="/auth?role=mentor&mode=register&redirect=/onboarding" className={styles.btnPrimary}>
                立即报名 <span>→</span>
              </Link>
              <a href="#how" className={styles.btnGhost}>
                了解流程
              </a>
            </div>
          </div>
        </section>

        {/* Why this matters */}
        <section className={styles.section} id="why">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>Why it matters</div>
              <h2 className={styles.sectionTitle}>这件事本不该这么难</h2>
              <p className={styles.sectionSub}>
                每年都有家庭在专业选择上花掉数万元中介费，得到的却是脱离一线的建议。
                你的真实经验，就是他们最需要的答案。
              </p>
            </div>
            <div className={styles.statGrid}>
              {STATS.map((s) => (
                <div key={s.big} className={styles.statCard}>
                  <div className={styles.statBig}>{s.big}</div>
                  <div className={styles.statCopy}>{s.copy}</div>
                  <div className={styles.statSrc}>{s.src}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What platform does for you */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>What we handle</div>
              <h2 className={styles.sectionTitle}>平台替你扛的事</h2>
              <p className={styles.sectionSub}>
                你只需要做一件事：把自己读过的路，认真讲清楚。其它琐碎全部由平台兜底。
              </p>
            </div>
            <div className={styles.benefitGrid}>
              {BENEFITS.map((b) => (
                <div key={b.title} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>{b.icon}</div>
                  <div>
                    <h3 className={styles.benefitTitle}>{b.title}</h3>
                    <p className={styles.benefitDesc}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to join */}
        <section className={styles.section} id="how">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>How to join</div>
              <h2 className={styles.sectionTitle}>四步加入指路</h2>
              <p className={styles.sectionSub}>
                整个流程在指路后台完成，全程无需联系任何人工客服。
              </p>
            </div>
            <div className={styles.stepsList}>
              {STEPS.map((s) => (
                <div key={s.num} className={styles.stepCard}>
                  <div className={styles.stepNum}>STEP {s.num}</div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>Who we look for</div>
              <h2 className={styles.sectionTitle}>我们在找这样的学长学姐</h2>
              <p className={styles.sectionSub}>
                这一批名额有限，优先开放给以下院校的在读生。
              </p>
            </div>
            <div>
              {REQS.map((r) => (
                <div key={r.title} className={styles.reqRow}>
                  <div className={styles.reqMark}>✓</div>
                  <div className={styles.reqText}>
                    <strong>{r.title}</strong>
                    <br />
                    <em>{r.desc}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.section} id="faq">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>FAQ</div>
              <h2 className={styles.sectionTitle}>报名前常被问到的</h2>
            </div>
            <div className={styles.faqList}>
              {FAQ.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <p className={styles.faqQ}>{f.q}</p>
                  <p className={styles.faqA}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2 className={styles.finalCtaTitle}>
              对口的家庭，正在排队等你。
            </h2>
            <p className={styles.finalCtaSub}>
              首批名额预计 5 月下旬截止。审核通过即可在 6 月 9 日 17:00 高考结束当晚开始接单。
            </p>
            <Link href="/auth?role=mentor&mode=register&redirect=/onboarding" className={styles.btnPrimary}>
              立即报名 <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>© 2026 问津 · 指路</div>
        <div>
          <a href="https://wenjin-zhilu.com">家长入口</a>
          <a href="/auth?role=mentor&mode=login">登录</a>
        </div>
      </footer>
    </div>
  );
}
