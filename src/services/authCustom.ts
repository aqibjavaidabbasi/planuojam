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
