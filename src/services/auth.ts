import { createQuery, fetchAPIWithToken, putAPI } from "./api";
import QueryString from "qs";

 
export async function fetchUser(jwt: string) {
  const filters = {};
  const query = createQuery({});
  const res = await fetchAPIWithToken(`users/me`, query, filters, jwt);
  return res;
}


export async function updateUserData(id: number, data: Record<string, unknown>){
  try{
    const res = await putAPI(`users/${id}`, data);
    return res;
  }catch{
    throw new Error('updateUserFailed');
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

// Public check for username availability. Returns availability and simple suggestions if taken.
export async function checkUsernameAvailability(username: string, signal?: AbortSignal): Promise<{ available: boolean; suggestions: string[] }> {
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
    // Build the URL
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
    const url = `${API_BASE}/api/users?${query}&${QueryString.stringify(filters, { encodeValuesOnly: true })}`;
    
    // Use fetch directly with signal support
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal, // Pass the abort signal
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const res = await response.json();
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
  } catch (error) {
    // If the request was aborted, throw the error so the caller can handle it
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return { available: false, suggestions: [] };
  }
}