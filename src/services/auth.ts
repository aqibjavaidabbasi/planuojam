import { API_URL, createQuery, fetchAPIWithToken, postAPI, postAPIWithToken, putAPI } from "./api";

export async function login(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/local", data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error("Check your email or password and try again!");
  }
}
export async function fetchUser(jwt: string) {
  const populate = {
    populate: {
      role: "*",
    },
  };
  const filters = {};
  const query = createQuery(populate);
  const res = await fetchAPIWithToken(`users/me`, query, filters, jwt);
  return res;
}

export async function register(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/local/register", data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error("We failed to register you. Please try again later!");
  }
}

export async function emailConfirmation(confirmationToken: string) {
  const url = `${API_URL}/api/auth/email-confirmation?confirmation=${encodeURIComponent(
    confirmationToken
  )}`;

  const response = await fetch(url, {
    method: "GET",
    redirect: "manual", // Handle 302 as a success indicator
  });

  // Handle successful confirmation (302 or opaqueredirect)
  if (response.status === 302 || response.type === "opaqueredirect") {
    // Success: Email confirmed
    return { success: true };
  }

  if (!response.ok) {
    // Check if response has a body before parsing
    const contentLength = response.headers.get("Content-Length");
    let errorData = {};
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        errorData = await response.json();
        console.log(errorData);
      } catch (_err) {
        console.warn("Failed to parse error response:", _err);
      }
    }
    // Simplified error handling
    const errorMessage = `Email confirmation failed: ${response.status}`;
    throw new Error(errorMessage);
  }
}
export async function resendEmailConfirmation(data: Record<string, unknown>) {
  const res = await postAPI("auth/send-email-confirmation", data);
  return res;
}

export async function forgotPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/forgot-password", data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Failed to send password reset email. Please try again later!"
    );
  }
}

export async function resetPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/reset-password", data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to reset password. Please try again later!");
  }
}

export async function updateUserData(id: number, data: Record<string, unknown>){
  try{
    const res = await putAPI(`users/${id}`, data);
    return res;
  }catch(err){
    console.log(err);
    throw new Error("Failed to update user, please try again later!");
  }
}
export async function updateUserPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPIWithToken(`auth/change-password`, data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update password, please try again later!");
  }
}

// --- Minimal user info helpers ---
export interface MinimalUserInfo {
  id: number;
  documentId: string;
  username: string;
  email: string;
}

export async function getUsersByDocumentIds(documentIds: string[]): Promise<MinimalUserInfo[]> {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return [];
  const jwt = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!jwt) throw new Error("No authentication token found. Please log in.");

  const fields = { fields: ["documentId", "username", "email"] } as const;
  const filters = {
    filters: { documentId: { $in: documentIds } },
  } as const;
  const query = createQuery(fields);
  const res = await fetchAPIWithToken('users', query, filters, jwt);
  return Array.isArray(res?.data) ? res.data : res;
}