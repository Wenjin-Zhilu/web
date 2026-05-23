import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

function getBaseURL() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const base = getBaseURL();

export const parentAuthClient = createAuthClient({
  baseURL: `${base}/api/auth`,
  plugins: [emailOTPClient()],
});

export const mentorAuthClient = createAuthClient({
  baseURL: `${base}/api/mauth`,
  plugins: [emailOTPClient()],
});

export function getAuthClient(role?: "parent" | "mentor") {
  if (role === "mentor") return mentorAuthClient;
  if (role === "parent") return parentAuthClient;
  if (typeof window !== "undefined" && window.location.host.startsWith("mentor.")) {
    return mentorAuthClient;
  }
  return parentAuthClient;
}

export function useSession() {
  const parent = parentAuthClient.useSession();
  const mentor = mentorAuthClient.useSession();

  const isPending = parent.isPending || mentor.isPending;
  const data = mentor.data || parent.data;

  return { data, isPending };
}

export async function signOutAll() {
  await Promise.allSettled([
    parentAuthClient.signOut(),
    mentorAuthClient.signOut(),
  ]);
}

// Default export for backward compatibility
export const authClient = parentAuthClient;
