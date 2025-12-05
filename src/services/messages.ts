import { createQuery, fetchAPIWithToken, postAPIWithToken, putAPI } from "./api";
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
  listingDocumentId?: string; // Document ID of the listing
  attachments?: Array<{
    id: number;
    url: string;
    mime?: string;
    name?: string;
  }>;
};

export type MinimalListingInfo = {
  documentId: string;
  title: string;
  slug: string;
  mainImage?: string;
  price?: number;
  averageRating?: number;
  ratingsCount?: number;
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


// Fetch unread messages for a specific receiver (readAt is null)
export async function fetchUnreadForReceiver(currentUserId: number, page = 1, pageSize = 200) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        receiver: { id: { $eq: currentUserId } },
        readAt: { $null: true },
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
  const data = Array.isArray(res?.data) ? res.data : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

function getTokenOrThrow() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Errors.Auth.noToken");
  return token;
}

export async function fetchThread(currentUserId: number, otherUserId: number, listingDocumentId?: string, page = 1, pageSize = 50) {
  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:asc"],
      populate: {
        sender: { fields: ["username", "email"] },
        receiver: { fields: ["username", "email"] },
        attachments: true,
      },
    },
    { encodeValuesOnly: true }
  );
  const filters = {
    filters: {
      $or: [
        { sender: { id: { $eq: currentUserId } }, receiver: { id: { $eq: otherUserId } } },
        { sender: { id: { $eq: otherUserId } }, receiver: { id: { $eq: currentUserId } } },
      ],
      ...(listingDocumentId && { listingDocumentId: { $eq: listingDocumentId } }),
    },
  }
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("messages", query, filters, token);
  const data = Array.isArray(res?.data) ? res.data : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

export async function sendMessage(senderId: number, receiverId: number, body: string, listingDocumentId?: string, attachmentsIds?: number[]) {
  const data: { sender: number; receiver: number; body: string; listingDocumentId?: string; attachments?: number[] } = {
    sender: senderId,
    receiver: receiverId,
    body,
  };
  if (listingDocumentId) {
    data.listingDocumentId = listingDocumentId;
  }
  if (attachmentsIds && attachmentsIds.length > 0) {
    data.attachments = attachmentsIds;
  }
  const populate = {
    sender: {
      populate: true
    },
    receiver: {
      populate: true
    },
    attachments: true
  }
  const query = createQuery(populate)
  const res = await postAPIWithToken("messages", { data }, {}, query);
  // res should contain data
  if (res?.data) return res.data;
  return res;
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
  const data = Array.isArray(res?.data) ? res.data : [];
  return { data, meta: res?.meta } as PaginatedResponse<Message>;
}

// Fetch minimal listing information by document IDs
export async function fetchMinimalListingsByDocumentIds(documentIds: string[]): Promise<MinimalListingInfo[]> {
  if (!documentIds.length) return [];
  
  const query = QueryString.stringify(
    {
      fields: ["documentId", "title", "slug", "price", "averageRating", "ratingsCount"],
      populate: {
        portfolio: {
          fields: ["url", "name", "mime"]
        }
      },
      filters: {
        documentId: { $in: documentIds }
      }
    },
    { encodeValuesOnly: true }
  );
  
  const token = getTokenOrThrow();
  const res = await fetchAPIWithToken("listings", query, {}, token);
  const data = Array.isArray(res?.data) ? res.data : [];
  
  return data.map((listing: { documentId: string; title: string; slug: string; portfolio?: Array<{ url: string }>; price?: number; averageRating?: number; ratingsCount?: number }) => ({
    documentId: listing.documentId,
    title: listing.title,
    slug: listing.slug,
    mainImage: listing.portfolio?.[0]?.url || null,
    price: listing.price,
    averageRating: listing.averageRating,
    ratingsCount: listing.ratingsCount,
  }));
}

// Helper function to count unread conversations (user-listing combinations)
export function countUnreadConversations(messages: Message[]): number {
  const conversationMap = new Map<string, boolean>();
  messages.forEach((m) => {
    const senderId = (m.sender as UserLite | undefined)?.id ?? (m.sender as unknown as number);
    const listingId = m.listingDocumentId;
    const conversationId = listingId ? `${senderId}-${listingId}` : `${senderId}`;
    conversationMap.set(conversationId, true);
  });
  return conversationMap.size;
}

// Helper function to filter and count unread conversations
export async function getUnreadConversationCount(userId: number): Promise<number> {
  const res = await fetchUnreadForReceiver(userId, 1, 200);
  const localIdsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('locallyReadMessageIds') : null;
  const locallyRead = new Set<string>(localIdsRaw ? JSON.parse(localIdsRaw) : []);
  const adjusted = res.data.filter((m) => {
    const mid = typeof m.documentId === 'string' ? m.documentId : String(m.id);
    return !locallyRead.has(mid);
  });
  return countUnreadConversations(adjusted);
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
