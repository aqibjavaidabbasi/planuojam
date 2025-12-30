import type { Message } from "@/services/messages";

export function isTempMessage(m: Message): boolean {
  const mid = typeof m.documentId === 'string' ? m.documentId : String(m.id);
  return mid === 'temp' || mid === '0' || mid === 'NaN';
}

export function buildConversationId(counterpartId: number, listingDocumentId?: string | null): string {
  const lid = (listingDocumentId || '').trim();
  return lid ? `${counterpartId}-${lid}` : `${counterpartId}`;
}

export function buildPreferredListingMap(list: Message[], conversationFromMessage: (m: Message) => { counterpartId: number }) {
  const preferred = new Map<number, { lid: string; ts: number }>();
  for (const m of list) {
    const { counterpartId } = conversationFromMessage(m);
    const lid = m.listingDocumentId;
    if (!Number.isFinite(counterpartId) || !(counterpartId > 0) || !lid) continue;
    const ts = new Date(m.createdAt || 0).getTime();
    const ex = preferred.get(counterpartId);
    if (!ex || ts >= ex.ts) preferred.set(counterpartId, { lid, ts });
  }
  return preferred;
}
