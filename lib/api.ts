export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// 学长/家长两套登录态跨子域共享，后端默认优先认家长。
// 在学长子域发请求时带上 x-auth-side，让后端先认学长，避免身份被家长会话冒领。
function authSideHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const host = window.location.host;
  if (host.startsWith("mentor.") || host.startsWith("admin.")) {
    return { "x-auth-side": "mentor" };
  }
  return {};
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...authSideHeaders(),
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : null) || res.statusText || `HTTP ${res.status}`;
    throw new ApiError(res.status, body, msg);
  }

  return body as T;
}

export const apiGet = <T = unknown>(path: string) => api<T>(path);

export const apiSend = <T = unknown>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
) =>
  api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });


export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const yuan = cents / 100;
  return `¥${yuan.toFixed(2)}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
