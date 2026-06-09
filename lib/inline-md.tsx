import { Fragment, type ReactNode } from "react";

/**
 * 极简内联 markdown 渲染：把 `**加粗**` 转成 <strong>，其余文本原样输出。
 *
 * AI 院校摘要由大模型生成，只会出现这种内联强调语法（散文段落、无标题/列表），
 * 所以不引第三方 markdown 库，也不用 dangerouslySetInnerHTML（避免 XSS / 过度工程化）。
 * 文本由 React 转义，安全。
 */
export function renderInlineMd(text: string | null | undefined): ReactNode {
  if (!text) return null;
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*\n]+)\*\*$/.exec(part);
    return m ? <strong key={i}>{m[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
  });
}
