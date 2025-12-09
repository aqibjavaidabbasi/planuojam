import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import {
  fetchAllForUser,
  sendMessage,
  fetchThread,
  Message,
  UserLite,
  fetchUnreadForReceiver,
  fetchMinimalListingsByDocumentIds,
  MinimalListingInfo,
  markMessageRead,
} from "@/services/messages";
import { uploadFilesWithToken, API_URL } from "@/services/api";
import { getUsersByDocumentIds, type MinimalUserInfo } from "@/services/auth";
import { websocketService } from "@/services/websocket";
import { MdAttachFile } from "react-icons/md";
import Button from "../custom/Button";
import { IoNavigateOutline, IoSendSharp } from "react-icons/io5";
import { useLocale } from "next-intl";
import Image from "next/image";

type MessagesProps = {
  initialUserId?: number;
  initialUserName?: string;
  initialUserDocumentId?: string;
  initialListingDocumentId?: string;
  onUnreadChange?: (total: number) => void;
};

function Messages({ initialUserId, initialUserName, initialUserDocumentId, initialListingDocumentId, onUnreadChange }: MessagesProps) {
  const t = useTranslations("Profile.Messages");
  const locale = useLocale();
  const user = useAppSelector((s) => s.auth.user);

  const [list, setList] = useState<Message[]>([]);
  const [listLoading, setListLoading] = useState(false); // used only for initial load
  const [listError, setListError] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({}); // Key: "userId-listingId"
  const [clearedConversationIds, setClearedConversationIds] = useState<Set<string>>(new Set());
  const [locallyReadIds, setLocallyReadIds] = useState<Set<string>>(new Set());

  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId ?? null);
  const [selectedListingDocumentId, setSelectedListingDocumentId] = useState<string | null>(initialListingDocumentId ?? null);
  const [thread, setThread] = useState<Message[]>([]);

  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [listReady, setListReady] = useState(false);
  const [listingsInfo, setListingsInfo] = useState<Record<string, MinimalListingInfo>>({});
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<{ username: string; isTyping: boolean }>({ username: "", isTyping: false });

  const [selectedCounterpartName, setSelectedCounterpartName] = useState<string>(initialUserName || "");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Keep refs in sync to avoid unstable useCallback deps
  const locallyReadIdsRef = useRef<Set<string>>(new Set());
  const clearedConversationIdsRef = useRef<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const pendingOptimisticMessagesRef = useRef<Array<{ body: string; timestamp: number; optimisticId: number }>>([]);

  useEffect(() => {
    locallyReadIdsRef.current = locallyReadIds;
  }, [locallyReadIds]);
  useEffect(() => {
    clearedConversationIdsRef.current = clearedConversationIds;
  }, [clearedConversationIds]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const clearedRaw = sessionStorage.getItem('clearedUnreadByConversation');
        if (clearedRaw) {
          const arr = JSON.parse(clearedRaw);
          if (Array.isArray(arr)) setClearedConversationIds(new Set<string>(arr));
        }
        const readRaw = sessionStorage.getItem('locallyReadMessageIds');
        if (readRaw) {
          const arr = JSON.parse(readRaw);
          if (Array.isArray(arr)) setLocallyReadIds(new Set<string>(arr));
        }
      }
    } catch {}
  }, []);

  const conversationFromMessage = useCallback(
    (m: Message) => {
      const myId = user?.id;
      const senderVal = (typeof m.sender === 'object' && m.sender) ? (m.sender as UserLite).id : (typeof m.sender === 'number' ? m.sender : undefined);
      const receiverVal = (typeof m.receiver === 'object' && m.receiver) ? (m.receiver as UserLite).id : (typeof m.receiver === 'number' ? m.receiver : undefined);
      const listingId = m.listingDocumentId;

      let otherIdNum: number = NaN;
      let username = '';

      if (typeof myId === 'number') {
        if (senderVal === myId) {
          // I am the sender; counterpart is receiver
          if (typeof receiverVal === 'number') otherIdNum = receiverVal;
          username = (typeof m.receiver === 'object' && m.receiver && (m.receiver as UserLite).username) ? (m.receiver as UserLite).username : '';
        } else if (receiverVal === myId) {
          // I am the receiver; counterpart is sender
          if (typeof senderVal === 'number') otherIdNum = senderVal;
          username = (typeof m.sender === 'object' && m.sender && (m.sender as UserLite).username) ? (m.sender as UserLite).username : '';
        } else {
          // Neither side matches me (fallback: pick the first valid side)
          if (typeof senderVal === 'number') {
            otherIdNum = senderVal;
            username = (typeof m.sender === 'object' && m.sender && (m.sender as UserLite).username) ? (m.sender as UserLite).username : '';
          } else if (typeof receiverVal === 'number') {
            otherIdNum = receiverVal;
            username = (typeof m.receiver === 'object' && m.receiver && (m.receiver as UserLite).username) ? (m.receiver as UserLite).username : '';
          }
        }
      }

      const conversationId = listingId ? `${otherIdNum}-${listingId}` : `${otherIdNum}`;

      return { 
        conversationId, 
        counterpartId: otherIdNum, 
        username, 
        listingDocumentId: listingId 
      };
    },
    [user?.id]
  );

  const conversationItems = useMemo(() => {
    // Deduplicate by conversation ID (user-listing combination), take the latest message for preview
    const map = new Map<string, Message>();
    for (const m of list) {
      const { conversationId, counterpartId } = conversationFromMessage(m);
      if (!conversationId || !Number.isFinite(counterpartId)) continue;
      const existing = map.get(conversationId);
      const mTime = new Date(m.createdAt || 0).getTime();
      if (!existing) {
        map.set(conversationId, m);
      } else {
        const eTime = new Date(existing.createdAt || 0).getTime();
        if (mTime > eTime) map.set(conversationId, m);
      }
    }
    // Sort conversations by latest message time desc to avoid jumping/reordering flicker
    return Array.from(map.entries())
      .sort(([, a], [, b]) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(([conversationId, m]) => {
        const { counterpartId, username, listingDocumentId } = conversationFromMessage(m);
        return {
          conversationId,
          message: m,
          counterpart: { id: counterpartId, username },
          listingDocumentId,
        };
      })
      .filter((c) => {
        if (!(Number.isFinite(c.counterpart.id) && c.counterpart.id > 0)) return false;
        const name = (c.counterpart.username || '').trim().toLowerCase();
        if (!name) return false;
        if (name === 'user null' || name === 'user undefined' || name === 'user nan') return false;
        return true;
      });
  }, [list, conversationFromMessage]);

  // Helper function to create temporary message for thread
  const createTempMessage = useCallback((counterpartId: number, counterpartName: string): Message => {
    return {
      id: 0,
      documentId: 'temp',
      sender: { id: counterpartId, username: counterpartName || 'User', email: '' } as UserLite,
      receiver: user?.id ? { id: user.id, username: user.username || 'You', email: user.email || '' } as UserLite : undefined,
      body: '',
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: []
    } as Message;
  }, [user?.id, user?.username, user?.email]);

  // Helper function to set up temporary thread if conversation doesn't exist
  const setupTempThreadIfNeeded = useCallback((counterpartId: number, counterpartName: string) => {
    if (!conversationItems.some(c => c.counterpart.id === counterpartId)) {
      const tempMessage = createTempMessage(counterpartId, counterpartName);
      setThread([tempMessage]);
    }
  }, [conversationItems, createTempMessage]);

  // Helper function to find conversation by user ID
  const findConversationByUserId = useCallback((userId: number) => {
    return conversationItems.find((c) => c.counterpart.id === userId);
  }, [conversationItems]);

  const loadList = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? true;
    if (!silent) setListLoading(true);
    setListError(null);
    try {
      if (!user?.id) throw new Error("Errors.Auth.noToken");
      const res = await fetchAllForUser(user.id, 1, 200);
      setList(res.data);
      
      // Fetch listing information for all messages
      const listingIds = [...new Set(
        res.data
          .map(m => m.listingDocumentId)
          .filter((id): id is string => id !== undefined && id !== null && id !== '')
      )];
      if (listingIds.length > 0) {
        const listingsData = await fetchMinimalListingsByDocumentIds(listingIds);
        const listingsMap = listingsData.reduce((acc, listing) => {
          acc[listing.documentId] = listing;
          return acc;
        }, {} as Record<string, MinimalListingInfo>);
        setListingsInfo(listingsMap);
      }
      
      // also fetch unread map for receiver (current user)
      try {
        const unreadRes = await fetchUnreadForReceiver(user.id, 1, 200);
        let map = unreadRes.data.reduce((acc, m) => {
          const mid = (typeof m.documentId === 'string' ? m.documentId : String(m.id));
          if (locallyReadIdsRef.current.has(mid)) return acc; // skip locally marked read
          const senderId = (m.sender as UserLite | undefined)?.id ?? (m.sender as unknown as number);
          const sid = Number(senderId);
          const listingId = m.listingDocumentId;
          const conversationId = listingId ? `${sid}-${listingId}` : `${sid}`;
          if (Number.isFinite(sid)) acc[conversationId] = (acc[conversationId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        // apply local clears
        if (clearedConversationIdsRef.current.size > 0) {
          map = { ...map };
          clearedConversationIdsRef.current.forEach((id) => { map[id] = 0; });
        }
        setUnreadByUser(map);
      } catch {
        // ignore silently
      }
    } catch (e: unknown) {
      let msg: string;
      if (typeof e === "string") {
        msg = e;
      } else if (e && typeof e === "object" && "message" in e) {
        msg = String((e).message);
      } else {
        msg = "Failed to load messages";
      }
      setListError(msg);
    } finally {
      if (!silent) setListLoading(false);
      setListReady(true);
    }
  }, [user?.id]);

  // Load list on mount and when user changes
  useEffect(() => {
    loadList();
  }, [loadList]);

  // WebSocket connection setup
  useEffect(() => {
    if (!user?.id) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(user.id);
        setWebsocketConnected(true);
      } catch {
        // console.error('Failed to connect to WebSocket:', error);
        setWebsocketConnected(false);
      }
    };

    connectWebSocket();

    // Set up WebSocket event listeners
    const handleNewMessage = (message: Message) => {      
      // Mark as processed to avoid double counting in notification handler
      const mId = typeof message.id === 'string' ? message.id : String(message.id);
      const dId = message.documentId || '';
      if (mId) processedMessageIdsRef.current.add(mId);
      if (dId) processedMessageIdsRef.current.add(dId);

      // Update conversation list with new message
      setList(prev => {
        const existingIndex = prev.findIndex(m => 
          m.documentId === message.documentId || m.id === message.id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }
        return [message, ...prev];
      });

      // Update thread if it's the current conversation
      const isCurrentConversation = 
        (message.sender?.id === selectedUserId && message.receiver?.id === user.id) ||
        (message.sender?.id === user.id && message.receiver?.id === selectedUserId);
      
      if (isCurrentConversation && 
          message.listingDocumentId === selectedListingDocumentId) {
        setThread(prev => {
          // Check if this message matches a pending optimistic message
          if (message.sender?.id === user.id) {
             const pendingIdx = pendingOptimisticMessagesRef.current.findIndex(p => 
               (p.body || "") === (message.body || "") && Math.abs(p.timestamp - new Date(message.createdAt || 0).getTime()) < 10000
             );
             if (pendingIdx !== -1) {
               const pending = pendingOptimisticMessagesRef.current[pendingIdx];
               // Remove from pending
               pendingOptimisticMessagesRef.current.splice(pendingIdx, 1);
               
               // Replace optimistic message in thread
               const optId = String(pending.optimisticId);
               const existingIdx = prev.findIndex(m => String(m.id) === optId);
               if (existingIdx >= 0) {
                 const next = [...prev];
                 next[existingIdx] = message;
                 return next;
               }
             }
          }

          // More robust duplicate check using both id and documentId
          const existingByDocumentId = prev.some(m => m.documentId === message.documentId);
          const existingById = prev.some(m => String(m.id) === String(message.id));
          
          if (existingByDocumentId || existingById) {
            return prev;
          }
          
          return [...prev, message];
        });
      } else {
        // If message is for another conversation (or current but different listing), update unread count
        // Only if I am the receiver
        if (message.receiver?.id === user.id) {
           const senderId = (message.sender as UserLite | undefined)?.id ?? (message.sender as unknown as number);
           const sid = Number(senderId);
           const listingId = message.listingDocumentId;
           const conversationId = listingId ? `${sid}-${listingId}` : `${sid}`;
           
           setUnreadByUser(prev => ({
             ...prev,
             [conversationId]: (prev[conversationId] || 0) + 1
           }));
        }
      }
    };

    const handleMessageNotification = (notification: {
      messageId: string | number;
      senderId: number;
      senderUsername: string;
      listingDocumentId?: string;
      body: string;
    }) => {
      const notifIdStr = String(notification.messageId);
      
      // Check if already processed by handleNewMessage
      if (processedMessageIdsRef.current.has(notifIdStr)) {
        return;
      }
      processedMessageIdsRef.current.add(notifIdStr);
      
      // Update conversation list with new message notification
      setList(prev => {
        // Find if this message already exists in our list
        const existing = prev.find(m => 
          m.id === notification.messageId || m.documentId === notification.messageId
        );
        
        if (existing) return prev;
        
        // Create a minimal message object for the notification
        const notificationMessage: Message = {
          id: typeof notification.messageId === 'string' ? parseInt(notification.messageId, 10) : notification.messageId,
          documentId: typeof notification.messageId === 'string' ? notification.messageId : String(notification.messageId),
          sender: { id: notification.senderId, username: notification.senderUsername, email: '' } as UserLite,
          receiver: user?.id ? { id: user.id, username: user.username || 'You', email: user.email || '' } as UserLite : undefined,
          body: notification.body,
          readAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachments: [],
          listingDocumentId: notification.listingDocumentId
        } as Message;
        
        return [notificationMessage, ...prev];
      });
      
      // Update unread count
      const conversationId = notification.listingDocumentId 
        ? `${notification.senderId}-${notification.listingDocumentId}`
        : `${notification.senderId}`;
      
      setUnreadByUser(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    };

    const handleTyping = (data: { userId: number; username: string; conversationId: string }) => {
      // Only show typing for current conversation
      const currentConversationId = selectedListingDocumentId 
        ? `${Math.min(user.id, selectedUserId || 0)}-${Math.max(user.id, selectedUserId || 0)}-${selectedListingDocumentId}`
        : `${Math.min(user.id, selectedUserId || 0)}-${Math.max(user.id, selectedUserId || 0)}`;
      
      if (data.conversationId === currentConversationId) {
        setTypingUser({ username: data.username, isTyping: true });
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to hide typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser({ username: "", isTyping: false });
        }, 3000);
      }
    };

    const handleStopTyping = (data: { userId: number; conversationId: string }) => {
      const currentConversationId = selectedListingDocumentId 
        ? `${Math.min(user.id, selectedUserId || 0)}-${Math.max(user.id, selectedUserId || 0)}-${selectedListingDocumentId}`
        : `${Math.min(user.id, selectedUserId || 0)}-${Math.max(user.id, selectedUserId || 0)}`;
      
      if (data.conversationId === currentConversationId) {
        setTypingUser({ username: "", isTyping: false });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    };

    const handleMessageRead = (data: { messageId: string }) => {
      // Mark message as read in thread
      setThread(prev => prev.map(m => {
        if (m.documentId === data.messageId || String(m.id) === data.messageId) {
          return { ...m, readAt: new Date().toISOString() };
        }
        return m;
      }));

      // Update locally read IDs
      setLocallyReadIds(prev => new Set([...prev, data.messageId]));
      
      // Decrement unread count
      const message = thread.find(m => 
        m.documentId === data.messageId || String(m.id) === data.messageId
      );
      if (message) {
        const senderId = (message.sender as UserLite | undefined)?.id ?? (message.sender as unknown as number);
        const sid = Number(senderId);
        const listingId = message.listingDocumentId;
        const conversationId = listingId ? `${sid}-${listingId}` : `${sid}`;
        
        setUnreadByUser(prev => ({
          ...prev,
          [conversationId]: Math.max(0, (prev[conversationId] || 0) - 1)
        }));
      }
    };

    const handleUnreadCountUpdated = (data: { count: number }) => {
      if (onUnreadChange) {
        onUnreadChange(data.count);
      }
    };

    const handleConnect = () => {
      setWebsocketConnected(true);
    };

    const handleDisconnect = () => {
      setWebsocketConnected(false);
    };

    // Register event listeners
    websocketService.on('new-message', handleNewMessage);
    websocketService.on('new-message-notification', handleMessageNotification);
    websocketService.on('message-read', handleMessageRead);
    websocketService.on('unread-count-updated', handleUnreadCountUpdated);
    websocketService.on('user-typing', handleTyping);
    websocketService.on('user-stop-typing', handleStopTyping);
    websocketService.on('connect', handleConnect);
    websocketService.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      websocketService.off('new-message', handleNewMessage);
      websocketService.off('new-message-notification', handleMessageNotification);
      websocketService.off('message-read', handleMessageRead);
      websocketService.off('unread-count-updated', handleUnreadCountUpdated);
      websocketService.off('user-typing', handleTyping);
      websocketService.off('user-stop-typing', handleStopTyping);
      websocketService.off('connect', handleConnect);
      websocketService.off('disconnect', handleDisconnect);
    };
  }, [user?.id, selectedUserId, selectedListingDocumentId, onUnreadChange, unreadByUser, listingsInfo, user?.email, user?.username, thread]);

  // Preselect conversation if initialUserId provided
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
      if (initialUserName) {
        setSelectedCounterpartName(initialUserName);
      }
      setupTempThreadIfNeeded(initialUserId, initialUserName || 'User');
    }
  }, [initialUserId, initialUserName, setupTempThreadIfNeeded]);

  // Set initial listing document ID if provided
  useEffect(() => {
    if (initialListingDocumentId) {
      setSelectedListingDocumentId(initialListingDocumentId);
    }
  }, [initialListingDocumentId]);

  // Ensure listing ID persists when conversation list loads
  useEffect(() => {
    if (initialListingDocumentId && !selectedListingDocumentId) {
      setSelectedListingDocumentId(initialListingDocumentId);
    }
  }, [initialListingDocumentId, selectedListingDocumentId, conversationItems]);

  // If initialUserDocumentId is provided (from URL), resolve to numeric id and preselect
  useEffect(() => {
    (async () => {
      if (!initialUserDocumentId || initialUserId || selectedUserId) return;
      try {
        const arr: MinimalUserInfo[] = await getUsersByDocumentIds([initialUserDocumentId]);
        const u = Array.isArray(arr) ? arr[0] : undefined;
        if (u?.id) {
          setSelectedUserId(u.id);
          setSelectedCounterpartName(initialUserName || u.username || "");
          setupTempThreadIfNeeded(u.id, initialUserName || u.username || 'User');
        }
      } catch {}
    })();
  }, [initialUserDocumentId, initialUserId, selectedUserId, initialUserName, setupTempThreadIfNeeded]);

  // When list or selection changes, derive counterpart name for header
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedCounterpartName("");
      return;
    }
    const found = findConversationByUserId(selectedUserId);
    if (found?.counterpart?.username) {
      setSelectedCounterpartName(found.counterpart.username);
    }
    // If not found, keep whatever name was already set (e.g., from URL-resolved user)
  }, [selectedUserId, findConversationByUserId]);

  // If current selection disappears due to filtering (e.g., deleted user), clear selection
  useEffect(() => {
    if (!listReady) return;
    // Do not clear if we have an initial listing ID from URL (new conversation scenario)
    if (initialListingDocumentId && selectedUserId) return;
    // Do not clear if we already have any messages in the thread (including a temp placeholder)
    if (selectedUserId && !conversationItems.some((c) => c.conversationId === `${selectedUserId}-${selectedListingDocumentId || ''}`) && thread.length === 0) {
      setSelectedUserId(null);
      setSelectedListingDocumentId(null);
    }
  }, [selectedUserId, selectedListingDocumentId, conversationItems, listReady, initialListingDocumentId, thread.length]);

  // Load thread messages when selection changes
  const loadThread = useCallback(async () => {
    if (!selectedUserId || !user?.id) {
      setThread([]);
      return;
    }

    setThreadLoading(true);
    setThreadError(null);
    
    try {
      const res = await fetchThread(user.id, selectedUserId, selectedListingDocumentId || undefined, 1, 50);
      // Deduplicate fetched thread immediately
      const uniqueData = (res.data || []).filter((m, index, self) =>
        index === self.findIndex((t) => (t.documentId === m.documentId || t.id === m.id))
      );
      setThread(uniqueData);
    } catch (error) {
      let msg: string;
      if (typeof error === "string") {
        msg = error;
      } else if (error && typeof error === "object" && "message" in error) {
        msg = String(error.message);
      } else {
        msg = "Failed to load thread";
      }
      setThreadError(msg);
    } finally {
      setThreadLoading(false);
    }
  }, [selectedUserId, selectedListingDocumentId, user?.id]);

  // Load thread when selection changes
  useEffect(() => {
    if (selectedUserId) {
      loadThread();
    }
  }, [selectedUserId, loadThread]);

  // Join/leave WebSocket conversation rooms when selection changes
  useEffect(() => {
    if (selectedUserId && websocketConnected) {
      websocketService.joinConversation(selectedUserId, selectedListingDocumentId || undefined);
      return () => {
        websocketService.leaveConversation(selectedUserId, selectedListingDocumentId || undefined);
      };
    }
  }, [selectedUserId, selectedListingDocumentId, websocketConnected]);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (websocketConnected) {
        websocketService.disconnect();
      }
    };
  }, [websocketConnected]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Revoke any object URLs on unmount or when previews list changes (cleanup previous)
  useEffect(() => {
    return () => {
      try {
        attachmentPreviews.forEach((u) => {
          if (u && u.startsWith('blob:')) URL.revokeObjectURL(u);
        });
      } catch {}
    };
  }, [attachmentPreviews]);

  // Auto-scroll to bottom when thread messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [thread]);

  // Ensure thread has unique messages by both documentId and id
  useEffect(() => {
    const seen = new Set<string>();
    const uniqueThread = thread.filter(message => {
      const key = `${message.documentId}-${message.id}`;
      if (seen.has(key)) {
        return false; // Remove duplicate
      }
      seen.add(key);
      return true;
    });
    
    if (uniqueThread.length !== thread.length) {
      setThread(uniqueThread);
    }
  }, [thread]);

  // Memoize the thread items for rendering to strictly prevent duplicates
  const renderedThreadItems = useMemo(() => {
    const seen = new Set<string>();
    return thread.filter(m => {
      const key = `${m.documentId}-${m.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((m) => {
      // Normalize sender id to avoid initial wrong side rendering when sender is a numeric id
      const senderId = (typeof m.sender === "object" && m.sender)
        ? (m.sender as UserLite).id
        : (typeof m.sender === "number" ? m.sender : undefined);
      const mine = senderId === user?.id;
      const createdAt = m.createdAt;
      const rawBody = (m.body ?? "") as string;
      const lines = rawBody.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const urlRegex = /https?:\/\/[^\s]+/i;
      // Prefer dedicated attachments field when present
      type MaybeAttrAttachment = NonNullable<Message["attachments"]>[number] & {
        attributes?: { url?: string; mime?: string; name?: string };
      };
      const att = (m.attachments ?? []) as MaybeAttrAttachment[];
      const attachments = Array.isArray(att)
        ? att.map((a) => ({
            id: (a?.id as number) ?? 0,
            url: a?.url ?? a?.attributes?.url ?? "",
            mime: a?.mime ?? a?.attributes?.mime,
            name: a?.name ?? a?.attributes?.name,
          }))
        : [];
      const normalizedAtt = attachments
        .map((a) => ({ ...a, url: a.url?.startsWith("http") ? a.url : (a.url ? `${API_URL}${a.url}` : a.url) }))
        .filter((a) => !!a.url);

      // Fallback to URLs inside body for legacy messages
      const legacyUrls = normalizedAtt.length === 0
        ? lines.filter((l) => urlRegex.test(l))
        : [];
      const caption = normalizedAtt.length === 0
        ? lines.filter((l) => !urlRegex.test(l)).join("\n")
        : lines.join("\n");
      const legacyImageUrls = legacyUrls.filter((u) => /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/i.test(u));
      const legacyFileUrls = legacyUrls.filter((u) => !legacyImageUrls.includes(u));

      return (
        <div key={`${m.documentId}-${m.id}-${m.createdAt}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
          <div className={`${normalizedAtt.length > 0 && !caption ? 'inline-block' : 'max-w-[90%] sm:max-w-[75%] md:max-w-[70%]'} rounded-lg px-3 py-2 text-sm break-words ${mine ? "bg-[#cc922f] text-white" : "bg-gray-100 text-gray-800"}`}>
            {caption && <div className="whitespace-pre-wrap">{caption}</div>}
            {normalizedAtt.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {normalizedAtt.map((a, idx) => (
                  <a key={`${a.id}-${a.url}-${idx}`} href={a.url} target="_blank" rel="noreferrer noopener" className="inline-block">
                    {a.mime?.startsWith("image/") ? (
                      <Image src={a.url} alt={a.name || "attachment"} width={320} height={240} className="rounded-md object-cover h-auto" />
                    ) : (
                      <div className={`px-3 py-2 bg-white/80 rounded text-xs flex items-center gap-2 min-w-0 ${mine ? "text-gray-800" : "text-gray-800"}`}>
                        <MdAttachFile size={16} className="flex-shrink-0" />
                        <span className="underline truncate" title={a.name || a.url}>{a.name || a.url}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
            {normalizedAtt.length === 0 && legacyImageUrls.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {legacyImageUrls.map((u, idx) => (
                  <a key={`${u}-${idx}`} href={u} target="_blank" rel="noreferrer noopener" className="inline-block">
                    <Image src={u} alt="attachment" width={320} height={240} className="rounded-md object-cover h-auto" />
                  </a>
                ))}
              </div>
            )}
            {normalizedAtt.length === 0 && legacyFileUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {legacyFileUrls.map((u, idx) => (
                  <a key={`${u}-${idx}`} href={u} target="_blank" rel="noreferrer noopener" className={`${mine ? "text-orange-100" : "text-blue-600"} underline break-words`}>
                    {u}
                  </a>
                ))}
              </div>
            )}
            <div className={`mt-1 text-[10px] ${mine ? "text-orange-100" : "text-gray-500"}`}>
              {createdAt ? new Date(createdAt).toLocaleString() : ""}
            </div>
          </div>
        </div>
      );
    });
  }, [thread, user?.id]);

  // When a thread is loaded/selected, optimistically clear unread for that conversation
  useEffect(() => {
    if (!selectedUserId) return;
    const conversationId = selectedListingDocumentId ? `${selectedUserId}-${selectedListingDocumentId}` : `${selectedUserId}`;
    setUnreadByUser((prev) => ({ ...prev, [conversationId]: 0 }));
    // Optimistically mark currently loaded thread messages as read in client state
    if (user?.id) {
      let changed = false;
      const mapped = thread.map((m) => {
        const isToMe = ((m.receiver as UserLite | undefined)?.id ?? (m.receiver as unknown as number)) === user.id;
        if (isToMe && !m.readAt) {
          changed = true;
          markMessageRead(m.documentId || String(m.id)).catch(() => {});
          return { ...m, readAt: new Date().toISOString() } as Message;
        }
        return m;
      });
      if (changed) {
        setThread(mapped);
      }
    }
    // persist cleared conversation id in sessionStorage
    setClearedConversationIds((prev) => {
      if (prev.has(conversationId)) return prev;
      const next = new Set(prev);
      next.add(conversationId);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('clearedUnreadByConversation', JSON.stringify(Array.from(next)));
        }
      } catch {}
      return next;
    });
    // persist locally read message ids for this thread (based on current thread state)
    setLocallyReadIds((prev) => {
      const next = new Set(prev);
      let added = false;
      thread.forEach((m) => {
        const isToMe = ((m.receiver as UserLite | undefined)?.id ?? (m.receiver as unknown as number)) === user?.id;
        if (isToMe) {
          const mid = (typeof m.documentId === 'string' ? m.documentId : String(m.id));
          if (!next.has(mid)) {
            next.add(mid);
            added = true;
          }
        }
      });
      if (added) {
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('locallyReadMessageIds', JSON.stringify(Array.from(next)));
          }
        } catch {}
        return next;
      }
      return prev;
    });
  }, [selectedUserId, selectedListingDocumentId, thread, user?.id]);

  // Emit total unread to parent AFTER state updates to avoid render-phase updates
  useEffect(() => {
    const total = Object.values(unreadByUser).reduce((a, b) => a + b, 0);
    if (onUnreadChange) onUnreadChange(total);
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('messages:unread-changed', { detail: { total } }));
      }
    } catch {}
  }, [unreadByUser, onUnreadChange]);

  // Typing indicators
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleComposerChange = (text: string) => {
    setComposerText(text);
    
    if (selectedUserId && websocketConnected && text.trim()) {
      // Send typing indicator
      websocketService.sendTyping(selectedUserId, selectedListingDocumentId || undefined);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedUserId && websocketConnected) {
          websocketService.stopTyping(selectedUserId, selectedListingDocumentId || undefined);
        }
      }, 1000);
    } else if (!text.trim() && typingTimeoutRef.current) {
      // Stop typing immediately if text is cleared
      clearTimeout(typingTimeoutRef.current);
      if (selectedUserId && websocketConnected) {
        websocketService.stopTyping(selectedUserId, selectedListingDocumentId || undefined);
      }
    }
  };

  const onSend = async () => {
    if (!selectedUserId) return;
    const text = composerText.trim();
    if (!text && attachments.length === 0) return;
    // Ensure we have a logged-in user before proceeding (avoids non-null assertions later)
    if (!user?.id) throw new Error("Errors.Auth.noToken");
    
    // Stop typing indicator
    if (websocketConnected) {
      websocketService.stopTyping(selectedUserId, selectedListingDocumentId || undefined);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    let optimisticId: number | null = null;
    try {
      setSending(true);
      setUploading(attachments.length > 0);
      // 1) Upload attachments if any
      let uploaded = [];
      let uploadedIds: number[] = [];
      if (attachments.length > 0) {
        uploaded = await uploadFilesWithToken(attachments);
        uploadedIds = (uploaded || []).map((u) => Number(u?.id)).filter((n) => Number.isFinite(n));
      }
      setUploading(false);
      // 2) Compose body: caption only (attachments stored in dedicated field)
      const composedBody = [text].filter(Boolean).join("\n");
      // optimistic append
      optimisticId = Date.now();
      
      // Track optimistic message
      pendingOptimisticMessagesRef.current.push({
        body: composedBody,
        timestamp: optimisticId,
        optimisticId: optimisticId
      });

      const optimistic: Message = {
        id: optimisticId,
        body: composedBody,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, username: user.username || String(user.id) },
        receiver: { id: selectedUserId, username: `User ${selectedUserId}`},
        listingDocumentId: selectedListingDocumentId || undefined,
        attachments: (uploaded || []).map((u) => ({
          id: Number(u?.id),
          url: (u?.url || "").startsWith("http") ? u?.url : `${API_URL}${(u?.url || "").startsWith('/') ? '' : '/'}${u?.url}`,
          mime: u?.mime,
          name: u?.name,
        })),
      };
      setThread((prev) => [...prev, optimistic]);
      setComposerText("");
      try {
        attachmentPreviews.forEach((u) => {
          if (u && u.startsWith('blob:')) URL.revokeObjectURL(u);
        });
      } catch {}
      setAttachments([]);
      setAttachmentPreviews([]);
      const saved = await sendMessage(user.id, selectedUserId, composedBody, selectedListingDocumentId || undefined, uploadedIds);
      
      // Remove from pending if still there (meaning WS didn't pick it up yet)
      const pIdx = pendingOptimisticMessagesRef.current.findIndex(p => p.optimisticId === optimisticId);
      if (pIdx !== -1) {
        pendingOptimisticMessagesRef.current.splice(pIdx, 1);
      }

      // reconcile: replace optimistic by saved using string id comparison; append if optimistic missing
      setThread((prev) => {
        const optId = String(optimisticId);
        const idx = prev.findIndex((m) => String(m.id) === optId);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = saved;
          return next;
        }
        // If optimistic message not found (e.g. replaced by WS), check if we already have the saved message
        // (WS might have added it)
        const alreadyHas = prev.some(m => m.documentId === saved.documentId || String(m.id) === String(saved.id));
        if (alreadyHas) return prev;

        return [...prev, saved];
      });
      // refresh list to update preview ordering (WebSocket handles thread updates)
      loadList({ silent: true });
    } catch {
      // rollback optimistic
      if (optimisticId !== null) {
        // Remove from pending
        const pIdx = pendingOptimisticMessagesRef.current.findIndex(p => p.optimisticId === optimisticId);
        if (pIdx !== -1) {
          pendingOptimisticMessagesRef.current.splice(pIdx, 1);
        }
        setThread((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // Clear conversation unread count when explicitly requested
  const clearConversationUnread = useCallback((conversationId: string) => {
    setUnreadByUser((prev) => ({ ...prev, [conversationId]: 0 }));
    setClearedConversationIds((prev) => new Set([...prev, conversationId]));
  }, []);

  const resolvingByDocId = !!initialUserDocumentId && !selectedUserId;

  return (
    <div className="p-3 md:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{t("title")}</h1>
            <div className={`flex items-center gap-1 text-xs ${websocketConnected ? 'text-green-600' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${websocketConnected ? 'bg-green-600' : 'bg-red-500'}`}></div>
              <span>{websocketConnected ? t('connected', { default: 'Connected' }) : t('disconnected', { default: 'Disconnected' })}</span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => loadList({ silent: false })}
          disabled={listLoading}
          style="secondary"
          extraStyles="!whitespace-nowrap flex-shrink-0"
        >
          {listLoading ? t("loading") : t("refresh")}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 min-h-[60vh]">
        {/* Left: conversations list - hidden on mobile when thread selected */}
        <div className={`${(selectedUserId || resolvingByDocId) ? "hidden md:flex" : "flex"} md:col-span-1 rounded-md shadow overflow-hidden flex-col p-1 max-h-[80vh]`}>
          <div className="flex-1 overflow-auto">
            {listError && (
              <div className="p-4 text-sm text-red-600">{listError}</div>
            )}
            {!listError && conversationItems.length === 0 && (
              <div className="p-6 text-sm text-gray-500">{t("noMessages")}</div>
            )}
            {conversationItems.length > 0 && (
              <ul>
              {conversationItems.map(({ conversationId, counterpart, listingDocumentId }) => {
                const isActive = selectedUserId === counterpart.id && selectedListingDocumentId === listingDocumentId;
                const unread = unreadByUser[conversationId] || 0;
                const listingInfo = listingDocumentId ? listingsInfo[listingDocumentId] : null;
                return (
                  <li
                    key={conversationId}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${isActive ? "bg-gray-50 text-gray-800" : "bg-white hover:bg-gray-50"}`}
                    onClick={() => {
                      setSelectedUserId(counterpart.id);
                      setSelectedListingDocumentId(listingDocumentId || null);
                      clearConversationUnread(conversationId);
                    }}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {/* Listing image as avatar */}
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
                            {t('noImage', { default: 'No img' })}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{ counterpart.username ? counterpart.username : t('deletedUser', { default: 'Deleted User' })}</span>
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
            </ul>)}
          </div>
        </div>

        {/* Right: thread */}
        <div className={`${(selectedUserId || resolvingByDocId) ? "flex" : "hidden md:flex"} md:col-span-3 shadow rounded-lg flex-col max-h-[80vh]`}>
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4 sm:p-6">
              {resolvingByDocId ? t("loading") : t("selectConversation", { default: "Select a conversation" })}
            </div>
          ) : (
            <>
              {/* User Conversation Header */}
              <div className="px-3 sm:px-4 py-3 bg-gray-50 font-medium text-sm sm:text-base flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="truncate">{t("conversationWith", { default: "Conversation with" })} {selectedCounterpartName || ""}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedListingDocumentId(null);
                  }}
                  className="md:hidden flex-shrink-0 text-gray-500 hover:text-gray-700 text-lg"
                  aria-label="close"
                >
                  ×
                </button>
              </div>

              {/* Listing Details Header - only shown when listing is selected */}
              {selectedListingDocumentId && listingsInfo[selectedListingDocumentId] && (
                <div className="px-3 sm:px-4 py-2.5 bg-white flex items-center justify-between gap-2" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {listingsInfo[selectedListingDocumentId].mainImage ? (
                        <Image 
                          src={listingsInfo[selectedListingDocumentId].mainImage!.startsWith('http') ? listingsInfo[selectedListingDocumentId].mainImage! : `${API_URL}${listingsInfo[selectedListingDocumentId].mainImage}`}
                          alt={listingsInfo[selectedListingDocumentId].title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t('noImage', { default: 'No img' })}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{listingsInfo[selectedListingDocumentId].title}</h3>
                      <div className="flex items-center gap-2 text-xs sm:text-sm mt-0.5">
                        {listingsInfo[selectedListingDocumentId].price !== undefined && (
                          <span className="font-medium text-primary">
                            ${listingsInfo[selectedListingDocumentId].price?.toLocaleString()}
                          </span>
                        )}
                        {listingsInfo[selectedListingDocumentId].averageRating !== undefined && listingsInfo[selectedListingDocumentId].averageRating > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>★ {listingsInfo[selectedListingDocumentId].averageRating}</span>
                            <span>({listingsInfo[selectedListingDocumentId].ratingsCount})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href={`/${locale}/listing/${listingsInfo[selectedListingDocumentId].slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs sm:text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex-shrink-0"
                  >
                    {t('view', { default: 'View' })} <IoNavigateOutline />
                  </a>
                </div>
              )}
              <div ref={messagesContainerRef} className="flex-1 overflow-auto p-3 sm:p-4 space-y-3">
                {threadLoading && (
                  <div className="text-sm text-gray-500 text-center py-4">{t("loading", { default: "Loading messages..." })}</div>
                )}
                {threadError && (
                  <div className="text-sm text-red-600 text-center py-4">{threadError}</div>
                )}
                {!threadLoading && !threadError && thread.length === 0 && (
                  <div className="text-sm text-gray-500">{t("noMessagesInThread", { default: "No messages yet in this thread" })}</div>
                )}

                {renderedThreadItems}
              </div>

              {/* Typing Indicator */}
              {typingUser.isTyping && (
                <div className="px-3 sm:px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>
                      {t('isTyping', { username: typingUser.username, default: `${typingUser.username} is typing...` })}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t p-2 sm:p-3 flex flex-col gap-2 sm:gap-3">
                {attachmentPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachmentPreviews.map((src, idx) => {
                      const f = attachments[idx];
                      const isImg = !!f?.type && f.type.startsWith("image/");
                      return (
                        <div key={idx} className="relative">
                          {isImg ? (
                            <Image src={src} width={64} height={64} className="h-16 w-16 object-cover rounded" alt="preview" />
                          ) : (
                            <a href={src} target="_blank" rel="noreferrer noopener" className="h-16 px-2 sm:px-3 py-2 bg-gray-100 rounded flex items-center gap-1 sm:gap-2 text-xs text-gray-800 min-w-0">
                              <MdAttachFile size={16} className="flex-shrink-0" />
                              <span className="truncate" title={f?.name || t('file', { default: 'file' })}>{f?.name || t('file', { default: 'file' })}</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              try {
                                const urlToRevoke = attachmentPreviews[idx];
                                if (urlToRevoke && urlToRevoke.startsWith('blob:')) URL.revokeObjectURL(urlToRevoke);
                              } catch {}
                              setAttachments((prev) => prev.filter((_, i) => i !== idx));
                              setAttachmentPreviews((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full h-6 w-6 text-xs cursor-pointer transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60"
                            aria-label="remove"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-2 sm:px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder={t("typeMessage", { default: "Type a message..." })}
                    value={composerText}
                    onChange={(e) => handleComposerChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                  <label className="p-1 sm:p-2 rounded-md cursor-pointer bg-white hover:bg-gray-50 flex-shrink-0">
                  <MdAttachFile size={18} className="sm:w-5 sm:h-5" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) {
                          setAttachments((prev) => [...prev, ...files]);
                          const urls = files.map((f) => URL.createObjectURL(f));
                          setAttachmentPreviews((prev) => [...prev, ...urls]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>
                  <Button
                    onClick={onSend}
                    style="ghost"
                    extraStyles="flex-shrink-0"
                    disabled={(composerText.trim() === "" && attachments.length === 0) || sending || uploading}
                  >
                    <IoSendSharp size={18} className="sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
