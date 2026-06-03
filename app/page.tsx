import Link from "next/link";
import styles from "./page.module.css";
import WeChatFloat from "./components/WeChatFloat";

const WHY_REASONS = [
  {
    title: "不只看分数线，更要看适不适合",
    body:
      "分数线告诉你「能不能报」，但兴趣、能力和专业真实内容，才决定孩子「适不适合读」。中青校媒调查显示，70.61% 的受访者认为选专业应考虑个人兴趣和特长，78.32% 的受访者建议选专业前先评估自己的喜好和优劣势。",
    source: "中国青年报·中青校媒，2,048 份有效问卷，2023",
  },
  {
    title: "不把转专业当唯一后路",
    body:
      "79.0% 的受访者大学时想过转专业，但 76.0% 的受访者认为大学生转专业并不容易。与其入学后被动补救，不如选择前先问清楚。",
    source: "中国青年报社会调查中心，2,002 人调查,2016",
  },
  {
    title: "真正读过的人，能补上信息盲区",
    body:
      "调查显示，69% 的人在填报志愿时不了解专业的学习内容、就业方向和排名；毕业后，仅有 16% 的人觉得所学专业符合当初预期。专业实际学什么、课程压力如何、学院氛围怎样，往往只有在里面读过的人讲得清楚。",
    source: "澎湃新闻 / iPIN 完美志愿，近千名大学生和白领调查，2016",
  },
];

const SCHOOLS = [
  { abbr: "SJTU", name: "上海交通大学", count: "142" },
  { abbr: "FUDAN", name: "复旦大学", count: "128" },
  { abbr: "TONGJI", name: "同济大学", count: "87" },
  { abbr: "ECNU", name: "华东师范大学", count: "64" },
  { abbr: "SUFE", name: "上海财经大学", count: "41" },
  { abbr: "SISU", name: "上海外国语大学", count: "28" },
  { abbr: "THU", name: "清华大学", count: "53" },
  { abbr: "PKU", name: "北京大学", count: "48" },
  { abbr: "RUC", name: "中国人民大学", count: "22" },
  { abbr: "ECUPL", name: "华东政法大学", count: "19" },
];

const STEPS = [
  {
    num: "01",
    title: "明确需要",
    desc: "将您的目标院校、专业倾向和最关心的维度告诉我们——学习内容、生活体验、保研考研、未来路径……",
  },
  {
    num: "02",
    title: "查看匹配",
    desc: "我们为您匹配 3–5 位学长学姐，您可以查看他们的简介、擅长方向与历史评价，挑选最适合回答您问题的一位。",
  },
  {
    num: "03",
    title: "预约咨询",
    desc: "经由平台预约时间，通过一次视频交流完成咨询，把专业学习、院校氛围、适配风险和未来路径讲清楚。",
  },
];

const AI_FEATURES = [
  {
    icon: "📝",
    title: "每次咨询，自动留档",
    desc: "通话结束后 AI 自动生成摘要，关键信息不遗漏，随时回顾。",
  },
  {
    icon: "🧩",
    title: "多次积累，读懂孩子",
    desc: "AI 整合历次咨询，逐步形成兴趣、能力、适合方向的学生画像。",
  },
  {
    icon: "🎯",
    title: "下次咨询，直奔重点",
    desc: "学长提前看到画像，不用重复介绍，每一次都更有针对性。",
  },
];

const GUARANTEES = [
  {
    icon: "真",
    title: "真实身份",
    desc: "采取邮箱 + 学生证/毕业证等多重验证，学长学姐的学校、专业、年级等信息将在确认后展示。",
  },
  {
    icon: "配",
    title: "对口匹配",
    desc: "根据孩子的目标院校、专业倾向和具体问题，个性化匹配合适的人，尽可能提供最相关的一手信息。",
  },
  {
    icon: "界",
    title: "回答有边界",
    desc: "什么阶段的同学回答什么阶段的问题。低年级同学更适合讲真实学习体验，高年级同学和校友更适合讲保研、就业等路径。平台会尽量区分本人亲历、同届观察、转述经验和公开资料。",
  },
  {
    icon: "评",
    title: "可评价反馈",
    desc: "咨询完成后进行双向评价，平台持续筛选优质回答者，沉淀一个能被反复信任的真实经验网络。",
  },
];

const FAQS = [
  {
    q: "问津是不是志愿填报辅导平台？",
    a: "不是。问津不替代分数线分析、录取概率测算或正式志愿填报服务，而是补充真实就读体验、专业适配和院校差异信息。",
  },
  {
    q: "学长学姐的回答会不会太主观？",
    a: "个人经验一定有边界。问津会通过身份确认、问题匹配、信息来源说明和评价机制，降低单一经验偏差。",
  },
  {
    q: "就业问题可以问吗？",
    a: "可以问未来路径和常见方向，但不会让没有亲历经验的人随意预测就业。涉及就业问题时，会尽量匹配高年级学生、研究生或毕业校友，并结合公开资料说明来源。",
  },
];

export default function Home() {
  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>津</div>
          <span className={styles.brandText}>问津</span>
          <span className={styles.brandSub}>FOR FAMILIES</span>
        </div>
        <nav className={styles.navLinks}>
          <a href="#why">为什么需要问津</a>
          <a href="#how">如何参与</a>
          <Link href="/questions">家长都在问</Link>
          <Link href="/reviews">院校评价 🔥</Link>
          <Link href="/auth?mode=login" className={styles.navBtn}>
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
              <span>首批 200 位对口学长学姐 · 6 月 9 日 17:00 上线</span>
            </div>
            <h1 className={styles.heroTitle}>
              升学路上疑问多？
              <br />
              找个<span className={styles.heroAccent}>过来人</span>，问个明白。
            </h1>
            <p className={styles.heroSub}>
              根据孩子的目标院校、专业倾向和具体问题，匹配真正读过相关学校和专业的学长学姐，
              帮您把专业学习、院校氛围、适配风险和未来路径讲清楚。
            </p>
            <div className={styles.heroCta}>
              <Link href="/auth" className={styles.btnPrimary}>
                看看能问谁 <span>→</span>
              </Link>
              <Link href="/reviews" className={styles.btnGhost}>
                免费看院校评价 🔥
              </Link>
              <Link href="/questions" className={styles.btnGhost}>
                看看家长都在问什么
              </Link>
            </div>
            <div className={styles.heroMeta}>注册即可浏览 · 按学校和专业筛选 · 看到合适的再付费</div>
          </div>
        </section>

        {/* Why this matters */}
        <section className={styles.section} id="why">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>Why it matters</div>
              <h2 className={styles.sectionTitle}>为什么需要问津？</h2>
              <p className={styles.sectionSub}>
                每年都有几十万家庭在专业选择上反复纠结。比起脱离一线的「通才」建议，
                您更需要的是一位真正读过这条路的人。
              </p>
            </div>
            <div className={styles.whyGrid}>
              {WHY_REASONS.map((r) => (
                <div key={r.title} className={styles.whyCard}>
                  <h3 className={styles.whyTitle}>{r.title}</h3>
                  <p className={styles.whyBody}>{r.body}</p>
                  <div className={styles.whySrc}>来源：{r.source}</div>
                </div>
              ))}
            </div>
            <div className={styles.whyClose}>
              <p className={styles.whyCloseLine}>
                问津致力于补充选择前最难获取的真实就读体验。
              </p>
              <p className={styles.whyClosePunch}>
                <span className={styles.heroAccent}>先问清楚，再做打算。</span>
              </p>
            </div>
          </div>
        </section>

        {/* School strip */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeadCenter}>
              <div className={styles.sectionEyebrow}>Coverage</div>
              <h2 className={styles.sectionTitle}>覆盖学校广泛</h2>
              <p className={styles.sectionSub}>
                覆盖热门院校与专业方向。每所院校配多位对口专业的学长学姐，覆盖从本科到博士、在读到已工作。
                若您的目标院校 / 专业暂未列出，注册后可联系我们提交需求。
              </p>
            </div>
            <div className={styles.schoolWrap}>
              {SCHOOLS.map((s) => (
                <div key={s.abbr} className={styles.schoolChip}>
                  <span className={styles.schoolAbbr}>{s.abbr}</span>
                  <span>{s.name}</span>
                  <span className={styles.schoolDot} />
                  <span className={styles.schoolCount}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.section} id="how">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>How it works</div>
              <h2 className={styles.sectionTitle}>三步，从问题到答案</h2>
              <p className={styles.sectionSub}>
                不需要一开始就把问题想得很完整。告诉我们孩子的目标和疑问，
                先看看能匹配到谁，再决定是否咨询。
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
            <div className={styles.priceHint}>
              <div className={styles.priceHintTag}>关于价格</div>
              <p className={styles.priceHintBody}>
                <strong className={styles.priceHintNum}>¥150 起</strong>
                ，把关键问题问清楚。具体价格会根据咨询时长、匹配对象和问题复杂度有所不同；
                您可在查看匹配对象后，再决定是否预约。
              </p>
            </div>
          </div>
        </section>

        {/* AI features */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeadCenter}>
              <div className={styles.sectionEyebrow}>Beyond one session</div>
              <h2 className={styles.sectionTitle}>不只是一次咨询</h2>
              <p className={styles.sectionSub}>
                每一次对话都在帮你看得更清。平台用 AI
                记录和整合每次咨询的关键信息，让孩子的升学画像越来越完整。
              </p>
            </div>
            <div className={styles.aiGrid}>
              {AI_FEATURES.map((f) => (
                <div key={f.title} className={styles.aiCard}>
                  <div className={styles.aiIcon}>{f.icon}</div>
                  <h3 className={styles.aiTitle}>{f.title}</h3>
                  <p className={styles.aiDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className={styles.section} id="guarantees">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionEyebrow}>What we guarantee</div>
              <h2 className={styles.sectionTitle}>问津能保证什么？</h2>
              <p className={styles.sectionSub}>
                真实体验有价值，但也有边界。问津不夸大、不包办、不替您做决定，
                而是尽力保证信息来源真实、回答边界清楚、咨询过程透明。
              </p>
            </div>
            <div className={styles.reasonGrid}>
              {GUARANTEES.map((r) => (
                <div key={r.title} className={styles.reasonCard}>
                  <div className={styles.reasonIcon}>{r.icon}</div>
                  <div>
                    <h3 className={styles.reasonTitle}>{r.title}</h3>
                    <p className={styles.reasonDesc}>{r.desc}</p>
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
              <h2 className={styles.sectionTitle}>常见问题</h2>
            </div>
            <div className={styles.faqList}>
              {FAQS.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <div className={styles.faqQ}>
                    <span className={styles.faqQTag}>Q</span>
                    {f.q}
                  </div>
                  <div className={styles.faqA}>
                    <span className={styles.faqATag}>A</span>
                    {f.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <h2 className={styles.finalCtaTitle}>
              先把一个问题问清楚。
              <br />
              你正在纠结的路，<span className={styles.heroAccent}>有人曾走过</span>。
            </h2>
            <p className={styles.finalCtaSub}>
              注册后按学校和专业浏览学长学姐，看到合适的再付费。
            </p>
            <div className={styles.heroCta}>
              <Link href="/auth" className={styles.btnPrimary}>
                看看能问谁 <span>→</span>
              </Link>
              <Link href="/questions" className={styles.btnGhost}>
                看看家长都在问什么
              </Link>
            </div>
          </div>
        </section>
      </main>

      <WeChatFloat accent="#b8472d" qr="/wechat-qr-parent.jpg" />

      <footer className={styles.footer} id="about">
        <div className={styles.footerTop}>
          <div className={styles.footerBrandBlock}>
            <div className={styles.footerBrand}>
              <div className={styles.brandLogo}>津</div>
              <span className={styles.brandText}>问津 · 指路</span>
            </div>
            <p className={styles.footerDesc}>
              对口学长学姐 · 升学专业咨询。平台担保、全程站内沟通，让每一个想填好志愿的家庭，
              都能找到一位「读这个专业的真人」问个明白。
            </p>
          </div>
          <div>
            <p className={styles.footerColTitle}>产品</p>
            <div className={styles.footerCol}>
              <a href="#how">如何参与</a>
              <a href="#guarantees">问津能保证什么</a>
              <Link href="/questions">家长都在问什么</Link>
              <Link href="/auth">看看能问谁</Link>
              <Link href="/auth?mode=login">登录</Link>
            </div>
          </div>
          <div>
            <p className={styles.footerColTitle}>条款</p>
            <div className={styles.footerCol}>
              <a href="#faq">常见问题</a>
              <a href="/privacy">隐私协议</a>
              <a href="/terms">用户协议</a>
              <a href="mailto:hello@wenjin-zhilu.com">联系我们</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div>© 2026 问津 · 指路</div>
          <div>在他们读过的路上，问一次清楚</div>
        </div>
      </footer>
    </div>
  );
}
