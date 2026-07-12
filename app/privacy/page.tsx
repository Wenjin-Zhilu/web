import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "隐私协议 · 问津｜指路",
  description: "问津｜指路 隐私协议：我们收集哪些信息、如何使用与保护，以及你享有的权利。",
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          ← 返回首页
        </Link>

        <h1 className={styles.title}>隐私协议</h1>
        <p className={styles.updated}>最后更新：2026 年 7 月 12 日</p>

        <p className={styles.intro}>
          「问津｜指路」（以下简称“本平台”）由问津团队运营，为家长、学生与在读学长学姐之间的志愿咨询提供撮合与在线通话服务。
          我们非常重视你的个人信息保护。本协议说明我们收集哪些信息、如何使用与保护这些信息，以及你享有的权利。使用本平台即表示你已阅读并同意本协议。
        </p>

        <section className={styles.section}>
          <h2 className={styles.h2}>一、我们收集的信息</h2>
          <p className={styles.p}>为提供服务，我们会在你使用相应功能时收集以下信息：</p>
          <ul className={styles.list}>
            <li>账号信息：邮箱、手机号、昵称，以及用于登录验证的验证码。</li>
            <li>家长／学生资料：所在高考地区、就读阶段、意向专业、关注方向等你主动填写的问卷内容。</li>
            <li>学长／学姐资料：就读院校、学院、专业、年级、个人介绍，以及为通过审核而上传的在读／学历证明材料。</li>
            <li>咨询与通话信息：预约与问询记录、订单信息，以及在你知情的情况下产生的通话记录与录音（用于服务质量与纠纷处理）。</li>
            <li>技术信息：为保障账号安全与服务稳定所必要的登录 IP、设备与浏览器标识、访问日志。</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>二、我们如何使用信息</h2>
          <ul className={styles.list}>
            <li>完成注册登录、身份审核与账号安全保护。</li>
            <li>为你匹配合适的学长学姐，并支持预约、问询、下单与在线通话。</li>
            <li>处理担保支付、提现与必要的对账、结算。</li>
            <li>在发生投诉或纠纷时进行核实与处理。</li>
            <li>向你发送与服务直接相关的通知（如预约提醒、订单状态变更）。</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>三、信息的共享与第三方</h2>
          <p className={styles.p}>
            我们不会出售你的个人信息。仅在实现服务功能所必需的范围内，与以下第三方共享必要信息：
          </p>
          <ul className={styles.list}>
            <li>实时音视频服务商（ZegoCloud）：用于建立你与咨询对象之间的在线通话连接。</li>
            <li>支付服务商：用于完成担保支付与提现，我们不会存储你的完整支付账户密码等敏感凭证。</li>
            <li>云服务与内容分发服务商：用于托管服务、加速访问与保障可用性。</li>
          </ul>
          <p className={styles.p}>
            此外，当法律法规要求、或为保护本平台及用户的合法权益所必需时，我们可能依法披露相关信息。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>四、信息的存储与保护</h2>
          <p className={styles.p}>
            我们将个人信息存储于境内合规的服务器，并采取传输加密、访问控制等合理的技术与管理措施保护你的信息安全。
            个人信息的保存期限不超过实现处理目的所必需的时间，法律法规另有规定的除外。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>五、你的权利</h2>
          <p className={styles.p}>在法律法规允许的范围内，你有权：</p>
          <ul className={styles.list}>
            <li>查询、更正你在本平台填写的个人资料。</li>
            <li>撤回你对特定信息处理的同意。</li>
            <li>
              注销账号：你可在「控制台 → 我的资料」页面自助注销。注销后，你的账号将被停用且无法再次登录，
              相关个人身份信息将不再对外展示；因交易、结算、投诉处理及法律法规要求需要保留的记录，我们将在符合规定的前提下留存。
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>六、未成年人保护</h2>
          <p className={styles.p}>
            本平台面向高考志愿填报家庭。若你为未满 18 周岁的未成年人，请在监护人的陪同与同意下使用本平台并提供个人信息。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>七、协议的更新</h2>
          <p className={styles.p}>
            我们可能适时更新本协议。协议更新后将在本页面公示，重大变更会以适当方式提示你。继续使用本平台即视为接受更新后的协议。
          </p>
        </section>

        <div className={styles.footer}>
          如对本隐私协议或你的个人信息有任何疑问，请联系我们：
          <br />
          邮箱 <a href="mailto:hello@wenjin-zhilu.com">hello@wenjin-zhilu.com</a>
          <br />
          另见 <Link href="/terms">《用户协议》</Link>。
        </div>
      </div>
    </div>
  );
}
