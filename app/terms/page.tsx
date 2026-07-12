import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "用户协议 · 问津｜指路",
  description: "问津｜指路 用户协议：平台服务内容、用户行为规范、咨询与支付规则及双方责任。",
};

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          ← 返回首页
        </Link>

        <h1 className={styles.title}>用户协议</h1>
        <p className={styles.updated}>最后更新：2026 年 7 月 12 日</p>

        <p className={styles.intro}>
          欢迎使用「问津｜指路」（以下简称“本平台”）。本协议是你与本平台之间就使用本平台服务所订立的约定。
          请你在使用前仔细阅读；一旦注册、登录或使用本平台，即表示你已充分理解并同意本协议的全部内容。
        </p>

        <section className={styles.section}>
          <h2 className={styles.h2}>一、服务内容</h2>
          <p className={styles.p}>
            本平台为高考志愿填报家庭（“问津”侧：家长／学生）与在读学长学姐（“指路”侧）之间，提供信息展示、智能匹配、
            预约问询、在线通话及担保支付等撮合服务。本平台是信息与撮合服务的提供方，咨询内容由学长学姐本人提供，
            仅供参考，不构成对录取结果或任何决定的承诺或保证。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>二、账号与注册</h2>
          <ul className={styles.list}>
            <li>你应使用真实、准确的信息注册，并妥善保管账号与登录凭证；因你自身原因导致的账号泄露风险由你自行承担。</li>
            <li>学长学姐侧需通过在读／学历等身份审核后方可提供咨询服务，你应保证所提交材料真实有效。</li>
            <li>每个自然人应在其真实身份下使用账号，不得冒用他人身份或提供虚假资料。</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>三、用户行为规范</h2>
          <p className={styles.p}>使用本平台时，你承诺不从事以下行为：</p>
          <ul className={styles.list}>
            <li>发布违反法律法规、公序良俗，或含有欺诈、骚扰、侮辱、色情等内容的信息。</li>
            <li>绕过平台私下交易、诱导他人脱离平台完成交易，以规避平台规则或担保机制。</li>
            <li>以不正当手段刷单、刷评价、恶意占用档期或干扰平台正常运行。</li>
            <li>未经许可抓取、复制、传播平台内容或他人个人信息。</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>四、咨询、预约与支付</h2>
          <ul className={styles.list}>
            <li>学长学姐开放档期即视为服务承诺；家长下单预订后订单即成立，学长学姐原则上不得单方取消。</li>
            <li>咨询费用通过平台担保支付：家长支付后款项由平台托管，服务正常完成后再行结算给学长学姐。</li>
            <li>如遇通话未能正常进行、服务与描述严重不符等情形，可依据平台规则申请处理，平台将居中核实。</li>
            <li>具体的匹配、预约、通话、结算与售后规则以平台页面实际展示与操作流程为准。</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>五、知识产权</h2>
          <p className={styles.p}>
            本平台的界面、标识、文字、图形及技术方案等，其知识产权归本平台或相关权利人所有。
            你在平台内发布的评价、资料等内容，你保证拥有相应权利，并授权本平台在提供服务所必需的范围内使用。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>六、免责声明</h2>
          <p className={styles.p}>
            学长学姐提供的院校、专业与经验分享属于个人观点，本平台不对其绝对准确性、完整性作出保证，
            亦不对你据此作出的志愿决策承担责任。因不可抗力、第三方服务故障等非本平台可控原因造成的服务中断，
            本平台在法律允许范围内不承担责任，但会尽力协助恢复。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>七、账号注销与协议终止</h2>
          <p className={styles.p}>
            你可在「控制台 → 我的资料」页面自助注销账号。注销后账号将被停用且无法再次登录；
            涉及交易、结算与法律法规要求需保留的记录，本平台将依规留存。若你严重违反本协议，本平台有权暂停或终止向你提供服务。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>八、协议更新与适用</h2>
          <p className={styles.p}>
            本平台可能适时更新本协议并在本页面公示。继续使用本平台即视为接受更新后的协议。
            本协议的解释与争议解决适用中华人民共和国法律。
          </p>
        </section>

        <div className={styles.footer}>
          如对本用户协议有任何疑问，请联系我们：
          <br />
          邮箱 <a href="mailto:hello@wenjin-zhilu.com">hello@wenjin-zhilu.com</a>
          <br />
          另见 <Link href="/privacy">《隐私协议》</Link>。
        </div>
      </div>
    </div>
  );
}
