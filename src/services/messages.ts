import { fetchAPIWithToken, postAPIWithToken, putAPI } from "./api";
import QueryString from "qs";

export type UserLite = {
  id: number;
  username: string;
  email?: string;
};

export type Message = {
  id: number;
  documentId?: string;
  body?: string;
  createdAt?: string;
  readAt?: string | null;
  sender?: UserLite;
  receiver?: UserLite;
  attachments?: Array<{
    id: number;
    url: string;
    mime?: string;
    name?: string;
  }>;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

function normalizeMessage(item: Message): Message {
  // Support both Strapi default transformResponse and entityService direct
  if (item) {
    return {
      id: item.id,
      body: item.body,
      createdAt: item.createdAt,
      readAt: item.readAt,
      sender: item.sender,
      receiver: item.receiver,
      attachments: item.attachments,
    };
  }
  return item;
}

function getTokenOrThrow() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Errors.Auth.noToken");
  return token;
}

export async function fetchInbox(currentUserId: number, page = 1, pageSize = 20) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        receiver: { id: { $eq: currentUserId } },
      },
      populate: {
        sender: { fields: ["username", "email"] },
        receiver: { fields: ["username", "email"] },
        attachments: true,
      },
    },
    { encodeValuesOnly: true }
  );
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, {}, token);
  const data = Array.isArray(res?.data) ? res.data.map(normalizeMessage) : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

export async function fetchOutbox(currentUserId: number, page = 1, pageSize = 20) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        sender: { id: { $eq: currentUserId } },
      },
      populate: {
        sender: { fields: ["username", "email"] },
        receiver: { fields: ["username", "email"] },
        attachments: true,
      },
    },
    { encodeValuesOnly: true }
  );
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, {}, token);
  const data = Array.isArray(res?.data) ? res.data.map(normalizeMessage) : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

export async function fetchThread(currentUserId: number, otherUserId: number, page = 1, pageSize = 50) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:asc"],
      filters: {
        $or: [
          { sender: { id: { $eq: currentUserId } }, receiver: { id: { $eq: otherUserId } } },
          { sender: { id: { $eq: otherUserId } }, receiver: { id: { $eq: currentUserId } } },
        ],
      },
      populate: {
        sender: { fields: ["username", "email"] },
        receiver: { fields: ["username", "email"] },
        attachments: true,
      },
    },
    { encodeValuesOnly: true }
  );
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, {}, token);
  const data = Array.isArray(res?.data) ? res.data.map(normalizeMessage) : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

export async function sendMessage(senderId: number, receiverId: number, body: string, attachmentsIds?: number[]) {
  const data: { sender: number; receiver: number; body: string; attachments?: number[] } = {
    sender: senderId,
    receiver: receiverId,
    body,
  };
  if (attachmentsIds && attachmentsIds.length > 0) {
    data.attachments = attachmentsIds;
  }
  const res = await postAPIWithToken("messages", { data });
  // res should contain data
  if (res?.data) return normalizeMessage(res.data);
  return normalizeMessage(res);
}

export async function markMessageRead(messageId: string) {
  // Use PUT to set readAt timestamp
  const res = await putAPI(`messages/${messageId}`, { data: { readAt: new Date().toISOString() } });
  return res;
}

// Fetch all messages for the current user (either sender or receiver)
export async function fetchAllForUser(currentUserId: number, page = 1, pageSize = 100) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        $or: [
          { sender: { id: { $eq: currentUserId } } },
          { receiver: { id: { $eq: currentUserId } } },
        ],
      },
      populate: {
        sender: { fields: ["username", "email"] },
        receiver: { fields: ["username", "email"] },
      },
    },
    { encodeValuesOnly: true }
  );
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, {}, token);
  const data = Array.isArray(res?.data) ? res.data.map(normalizeMessage) : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

// Count unread messages for the current user (receiver is current user and readAt is null)
export async function countUnread(currentUserId: number) {
  const query = QueryString.stringify(
    {
      pagination: { page: 1, pageSize: 1 },
      filters: {
        receiver: { id: { $eq: currentUserId } },
        readAt: { $null: true },
      },
    },
    { encodeValuesOnly: true }
  );
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, {}, token);
  const total = res?.meta?.pagination?.total ?? 0;
  return Number(total) || 0;
}
