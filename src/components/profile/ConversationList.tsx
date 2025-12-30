import React from "react";
import Image from "next/image";
import { API_URL } from "@/services/api";

export type ConversationItem = {
  conversationId: string;
  counterpart: { id: number; username: string };
  listingDocumentId?: string;
};

type Props = {
  conversations: ConversationItem[];
  listingsInfo: Record<string, { documentId: string; title: string; slug: string; mainImage?: string }>;
  unreadByUser: Record<string, number>;
  selectedUserId: number | null;
  selectedListingDocumentId: string | null;
  onSelect: (userId: number, listingDocumentId: string | null, conversationId: string) => void;
  emptyText: string;
  listError?: string | null;
  refreshButton?: React.ReactNode;
};

const ConversationList: React.FC<Props> = ({
  conversations,
  listingsInfo,
  unreadByUser,
  selectedUserId,
  selectedListingDocumentId,
  onSelect,
  emptyText,
  listError,
  refreshButton,
}) => {
  return (
    <div className="flex-1 overflow-auto">
      {listError && (
        <div className="p-4 text-sm text-red-600">{listError}</div>
      )}
      {!listError && conversations.length === 0 && (
        <div className="p-6 text-sm text-gray-500">{emptyText}</div>
      )}
      {conversations.length > 0 && (
        <ul>
          {conversations.map(({ conversationId, counterpart, listingDocumentId }) => {
            const isActive = selectedUserId === counterpart.id && selectedListingDocumentId === (listingDocumentId || null);
            const unread = unreadByUser[conversationId] || 0;
            const listingInfo = listingDocumentId ? listingsInfo[listingDocumentId] : null;
            return (
              <li
                key={conversationId}
                className={`p-2 rounded-md cursor-pointer transition-colors ${isActive ? "bg-gray-50 text-gray-800" : "bg-white hover:bg-gray-50"}`}
                onClick={() => onSelect(counterpart.id, listingDocumentId || null, conversationId)}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                    {listingInfo?.mainImage ? (
                      <Image 
                        src={listingInfo.mainImage.startsWith('http') ? listingInfo.mainImage : `${API_URL}${listingInfo.mainImage}`}
                        alt={listingInfo.title || "Listing"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{counterpart.username || "Deleted User"}</span>
                      {unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full bg-red-600 text-white flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {listingInfo && (
                      <p className="text-xs text-gray-500 truncate mt-1">{listingInfo.title}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {refreshButton}
    </div>
  );
};

export default ConversationList;
