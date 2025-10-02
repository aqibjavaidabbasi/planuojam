import { API_URL, createQuery, fetchAPI, fetchAPIWithToken, postAPI, postAPIWithToken, putAPI } from "./api";

export async function login(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/local", data);
    return res;
  } catch {
    throw new Error('invalidCredentials');
  }
}
 
export async function fetchUser(jwt: string) {
  const filters = {};
  const query = createQuery({});
  const res = await fetchAPIWithToken(`users/me`, query, filters, jwt);
  return res;
}

export async function register(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/local/register", data);
    return res;
  } catch {
    throw new Error('registerFailed');
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
    throw new Error('emailConfirmFailed');
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
  } catch {
    throw new Error('Errors.Auth.forgotFailed');
  }
}

export async function resetPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPI("auth/reset-password", data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error('Errors.Auth.resetFailed');
  }
}

export async function updateUserData(id: number, data: Record<string, unknown>){
  try{
    const res = await putAPI(`users/${id}`, data);
    return res;
  }catch{
    throw new Error('updateUserFailed');
  }
}
export async function updateUserPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPIWithToken(`auth/change-password`, data);
    return res;
  } catch (err) {
    console.log(err);
    throw new Error('Errors.Auth.updatePasswordFailed');
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
  if (!jwt) throw new Error('Errors.Auth.noToken');

  const fields = { fields: ["documentId", "username", "email"] } as const;
  const filters = {
    filters: { documentId: { $in: documentIds } },
  } as const;
  const query = createQuery(fields);
  const res = await fetchAPIWithToken('users', query, filters, jwt);
  return Array.isArray(res?.data) ? res.data : res;
}

// Public lookup of user by email. Returns null if not found or not accessible.
export async function publicFindUserByEmail(email: string): Promise<{ id: number; email: string; confirmed: boolean } | null> {
  try {
    if (!email) return null;
    const filters = {
      filters: {
        email : {
          $eqi: email,
        }
      }
    }
    const query = createQuery({})
    const res = await fetchAPI('users',query, filters);
    if (!res.ok) return null;
    const data = await res.json();
    const users = Array.isArray(data) ? data : data?.data;
    if (Array.isArray(users) && users.length > 0) {
      const u = users[0];
      // Strapi /api/users returns array of plain user objects (no attributes wrapper)
      const emailVal = u.email;
      const confirmedVal = u.confirmed;
      const idVal = u.id;
      if (emailVal) return { id: idVal, email: String(emailVal), confirmed: Boolean(confirmedVal) };
    }
    return null;
  } catch {
    return null;
  }
}

// Public check for username availability. Returns availability and simple suggestions if taken.
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; suggestions: string[] }> {
  const clean = (username || '').trim();
  if (!clean) return { available: false, suggestions: [] };

  const filters = {
    filters: {
      username: {
        $eqi: clean,
      },
    },
  };
  const query = createQuery({});

  try {
    const res = await fetchAPI('users', query, filters);
    const users = Array.isArray(res) ? res : res?.data;
    const taken = Array.isArray(users) && users.length > 0;
    if (!taken) return { available: true, suggestions: [] };

    const base = clean.replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 20) || 'user';
    const rand = () => Math.floor(Math.random() * 900 + 100); // 100-999
    const year = new Date().getFullYear();
    const candidates = [
      `${base}${rand()}`,
      `${base}${rand()}`,
      `${base}${rand()}`,
      `${base}${year % 100}`,
      `${base}${rand()}`,
    ];
    const suggestions = Array.from(new Set(candidates)).slice(0, 5);
    return { available: false, suggestions };
  } catch {
    return { available: false, suggestions: [] };
  }
}