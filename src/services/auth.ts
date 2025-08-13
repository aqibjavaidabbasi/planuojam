import { API_URL, createQuery, fetchAPI, fetchAPIWithToken, postAPI } from "./api";

export async function login(data: Record<string, unknown>) {
  try{
    const res = await postAPI("auth/local", data);
    return res;
  }catch(err){
    throw new Error("Check your email or password and try again!")
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

export async function register(data: Record<string, unknown>){
  try{

    const res = await postAPI('auth/local/register', data);
    return res;
  }catch(err){
    throw new Error("We failed to register you. Please try again later!")
  }
}

export async function emailConfirmation(confirmationToken: string){
    const url = `${API_URL}/api/auth/email-confirmation?confirmation=${encodeURIComponent(confirmationToken)}`;
  
    console.log("Confirming email with URL:", url);
  
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual', // Handle 302 as a success indicator
    });

     // Handle successful confirmation (302 or opaqueredirect)
  if (response.status === 302 || response.type === 'opaqueredirect') {
    // Success: Email confirmed
    return { success: true };
  }

  if (!response.ok) {
    // Check if response has a body before parsing
    const contentLength = response.headers.get('Content-Length');
    let errorData = {};
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        errorData = await response.json();
      } catch (err) {
        console.warn('Failed to parse error response:', err);
      }
    }
    // Fix: Properly type errorData and safely access error message
    const errorMessage =
      typeof errorData === 'object' &&
      errorData !== null &&
      'error' in errorData &&
      typeof (errorData as any).error === 'object' &&
      (errorData as any).error !== null &&
      'message' in (errorData as any).error
        ? (errorData as any).error.message
        : undefined;

    throw new Error(errorMessage || `Email confirmation failed: ${response.status}`);
  }
}
export async function resendEmailConfirmation(data: Record<string, unknown>){
  const res = await postAPI('auth/send-email-confirmation',data);
  return res;
}

export async function forgotPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPI('auth/forgot-password', data);
    return res;
  } catch (err) {
    throw new Error("Failed to send password reset email. Please try again later!");
  }
}

export async function resetPassword(data: Record<string, unknown>) {
  try {
    const res = await postAPI('auth/reset-password', data);
    return res;
  } catch (err) {
    throw new Error("Failed to reset password. Please try again later!");
  }
}