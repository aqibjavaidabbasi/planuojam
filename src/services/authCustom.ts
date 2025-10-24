import { API_URL } from "./api";

type ApiError = { error?: { key?: string; field?: string; [k: string]: unknown } };

async function postJson<TResp>(path: string, body: unknown, init: RequestInit = {}): Promise<TResp> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(body),
    credentials: "include",
    ...init,
  });
  console.log(`${API_URL}${path}`)
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as TResp;
}

async function authedJson<TResp>(method: "PUT" | "POST", path: string, body: unknown): Promise<TResp> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as TResp;
}

export interface RegisterRequest { username: string; email: string; password: string; serviceType?: string }
export interface OtpSentResponse { status: "otp_sent"; email?: string; otpExpiresAt: string }
export interface JwtUserResponse { jwt: string; user: unknown }

export function customRegister(params: RegisterRequest) {
  return postJson<OtpSentResponse>(
    "/api/auth/custom-register",
    params
  );
}

export function customConfirmEmail(params: { email: string; code: string }) {
  return postJson<JwtUserResponse>("/api/auth/custom-confirm", params);
}

export function customResendConfirmation(params: { email: string }) {
  return postJson<OtpSentResponse>(
    "/api/auth/custom-resend-confirmation",
    params
  );
}

export function customForgotPassword(params: { email: string }) {
  return postJson<OtpSentResponse>(
    "/api/auth/custom-forgot-password",
    params
  );
}

export function customResetPassword(params: { email: string; code: string; password: string }) {
  return postJson<{ status: "password_reset" }>("/api/auth/custom-reset-password", params);
}

export function customLogin(params: { email: string; password: string }) {
  return postJson<JwtUserResponse>("/api/auth/custom-login", params);
}

// Custom authenticated updates
export function customUpdateProfile(params: { username?: string; serviceType?: string | null }) {
  return authedJson<{ user: unknown }>("PUT", "/api/auth/custom-update-profile", params);
}

export function customUpdatePassword(params: { currentPassword: string; newPassword: string }) {
  return authedJson<{ status: "password_updated" }>("PUT", "/api/auth/custom-update-password", params);
}

export function customSetPasswordFirstTime(params: { newPassword: string }) {
  return authedJson<{ status: "password_set" }>("POST", "/api/social-auth/set-password", params);
}
