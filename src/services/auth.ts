import { createQuery, fetchAPIWithToken, postAPI } from "./api";

export async function login(data: Record<string, unknown>) {
  const res = await postAPI("auth/local", data);
  return res;
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
  const res = await postAPI('/auth/local/register', data);
  return res;
}