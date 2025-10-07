import { postAPIWithToken } from "./api";


export async function createStarUsageLog(payload: Record<string, unknown>) {
  // Strapi expects plain body with fields; postAPIWithToken handles token and headers
  return postAPIWithToken("star-usage-logs", payload);
}
