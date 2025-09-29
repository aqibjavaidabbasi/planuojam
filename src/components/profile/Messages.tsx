import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import {
  fetchAllForUser,
  fetchThread,
  markMessageRead,
  sendMessage,
  Message,
  UserLite,
} from "@/services/messages";
import { uploadFilesWithToken, API_URL } from "@/services/api";
import { MdAttachFile } from "react-icons/md";
import Button from "../custom/Button";
import { IoSendSharp } from "react-icons/io5";
import Image from "next/image";

type MessagesProps = {
  initialUserId?: number;
};

function Messages({ initialUserId }: MessagesProps) {
  const t = useTranslations("Profile.Messages");
  const user = useAppSelector((s) => s.auth.user);

  const [list, setList] = useState<Message[]>([]);
  const [listLoading, setListLoading] = useState(false); // used only for initial load
  const [listError, setListError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false); // used only for initial load of a thread
  const [threadError, setThreadError] = useState<string | null>(null);

  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const suppressMarkReadRef = useRef<boolean>(false);
  const refreshingRef = useRef<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCounterpartName, setSelectedCounterpartName] = useState<string>("");

  const counterpartFromMessage = useCallback(
    (m: Message) => {
      const s = m.sender?.id ?? m.sender;
      const r = m.receiver?.id ?? m.receiver;
      const myId = user?.id;
      const otherId = s === myId ? r : s;
      const otherObj = s === myId ? (m.receiver) : (m.sender);
      return { id: Number(otherId), username: otherObj?.username ?? `User ${otherId}` };
    },
    [user?.id]
  );

  const conversationItems = useMemo(() => {
    // Deduplicate by counterpart id, take the latest message for preview
    const map = new Map<number, Message>();
    for (const m of list) {
      const { id } = counterpartFromMessage(m);
      const existing = map.get(id);
      const mTime = new Date(m.createdAt || 0).getTime();
      if (!existing) {
        map.set(id, m);
      } else {
        const eTime = new Date(existing.createdAt || 0).getTime();
        if (mTime > eTime) map.set(id, m);
      }
    }
    return Array.from(map.entries()).map(([id, m]) => ({
      id,
      message: m,
      counterpart: counterpartFromMessage(m),
    }));
  }, [list, counterpartFromMessage]);

  const loadList = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? (list.length > 0);
    if (!silent) setListLoading(true);
    setListError(null);
    try {
      if (!user?.id) throw new Error("Errors.Auth.noToken");
      const res = await fetchAllForUser(user.id, 1, 200);
      setList(res.data);
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
    }
  }, [user?.id, list.length]);

  const loadThread = useCallback(
    async (uid: number, opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? (thread.length > 0);
      if (!silent) setThreadLoading(true);
      setThreadError(null);
      try {
        if (!user?.id) throw new Error("Errors.Auth.noToken");
        const res = await fetchThread(user.id, uid, 1, 200);
        setThread(res.data);
        // Mark received messages as read
        const myId = user?.id;
        if (myId) {
          const unread = res.data.filter(
            (m) => (m.receiver?.id ?? m.receiver) === myId && !m.readAt
          );
          // Fire and forget
          if (!suppressMarkReadRef.current) {
            unread.slice(0, 5).forEach((m) => {
              if (typeof m.documentId === "string") {
                markMessageRead(m.documentId).catch((err) => {
                  // If backend doesn't support PUT for messages, avoid future attempts
                  if (err && String(err).includes("Not Found")) {
                    suppressMarkReadRef.current = true;
                  }
                });
              }
            });
          }
        }
      } catch (e: unknown) {
        let msg: string;
        if (typeof e === "string") {
          msg = e;
        } else if (e && typeof e === "object" && "message" in e) {
          msg = String((e).message);
        } else {
          msg = "Failed to load thread";
        }
        setThreadError(msg);
      } finally {
        if (!silent) setThreadLoading(false);
      }
    },
    [user?.id, thread.length]
  );

  // Load list on mount and when user changes
  useEffect(() => {
    loadList();
  }, [loadList]);

  // Preselect conversation if initialUserId provided
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // When list or selection changes, derive counterpart name for header
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedCounterpartName("");
      return;
    }
    const found = conversationItems.find((c) => c.id === selectedUserId);
    setSelectedCounterpartName(found?.counterpart?.username || "");
  }, [selectedUserId, conversationItems]);

  // Load thread and set up polling when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      loadThread(selectedUserId);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadThread(selectedUserId, { silent: true }), 15000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [selectedUserId, loadThread]);

  const onSend = async () => {
    if (!selectedUserId) return;
    const text = composerText.trim();
    if (!text && attachments.length === 0) return;
    // Ensure we have a logged-in user before proceeding (avoids non-null assertions later)
    if (!user?.id) throw new Error("Errors.Auth.noToken");
    let optimisticId: number | null = null;
    try {
      setSending(true);
      setUploading(true);
      // 1) Upload attachments if any
      let uploaded = [];
      let uploadedIds: number[] = [];
      if (attachments.length > 0) {
        uploaded = await uploadFilesWithToken(attachments);
        uploadedIds = (uploaded || []).map((u) => Number(u?.id)).filter((n) => Number.isFinite(n));
      }
      // 2) Compose body: caption only (attachments stored in dedicated field)
      const composedBody = [text].filter(Boolean).join("\n");
      // optimistic append
      optimisticId = Date.now();
      const optimistic: Message = {
        id: optimisticId,
        body: composedBody,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, username: user.username || String(user.id) },
        receiver: { id: selectedUserId, username: `User ${selectedUserId}` },
        attachments: (uploaded || []).map((u) => ({
          id: Number(u?.id),
          url: (u?.url || "").startsWith("http") ? u?.url : `${API_URL}${u?.url}`,
          mime: u?.mime,
          name: u?.name,
        })),
      };
      setThread((prev) => [...prev, optimistic]);
      setComposerText("");
      setAttachments([]);
      setAttachmentPreviews([]);
      const saved = await sendMessage(user.id, selectedUserId, composedBody, uploadedIds);
      // reconcile: replace optimistic by saved if needed
      setThread((prev) => prev.map((m) => (m.id === optimisticId ? saved : m)));
      // refresh list to update preview ordering
      loadList({ silent: true });
    } catch {
      // rollback optimistic
      if (optimisticId !== null) {
        setThread((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const onRefresh = async () => {
    const now = Date.now();
    if (now - refreshingRef.current < 2000) return; // debounce 2s
    refreshingRef.current = now;
    setRefreshing(true);
    try {
      await loadList({ silent: true });
      if (selectedUserId) await loadThread(selectedUserId, { silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-gray-600 mt-1">{t("subtitle")}</p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          style="secondary"
        >
          {refreshing ? t("loading", { default: "Loading..." }) : t("refresh", { default: "Refresh" })}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[60vh]">
        {/* Left: conversations list */}
        <div className="md:col-span-1 rounded-md shadow overflow-hidden flex flex-col p-1 max-h-[80vh]">
          <div className="flex-1 overflow-auto">
            {listLoading && (
              <div className="p-4 text-sm text-gray-500"></div>
            )}
            {listError && (
              <div className="p-4 text-sm text-red-600">{listError}</div>
            )}
            {!listLoading && !listError && conversationItems.length === 0 && (
              <div className="p-6 text-sm text-gray-500">{t("noMessages", { default: "No messages yet" })}</div>
            )}

            <ul>
              {conversationItems.map(({ id, counterpart }) => {
                const isActive = selectedUserId === id;
                return (
                  <li
                    key={id}
                    className={`p-2 rounded-md cursor-pointer ${isActive ? "bg-gray-50 text-gray-800" : "bg-white hover:bg-gray-50"}`}
                    onClick={() => setSelectedUserId(id)}
                  >
                    <div className="flex items-center justify-between font-medium">
                        {counterpart.username}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: thread */}
        <div className="md:col-span-3 shadow rounded-lg flex flex-col max-h-[80vh]">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-6">
              {t("selectConversation", { default: "Select a conversation" })}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 font-medium">
                {t("conversationWith", { default: "Conversation with" })} {selectedCounterpartName || ""}
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {threadLoading && <div className="text-sm text-gray-500"></div>}
                {threadError && (
                  <div className="text-sm text-red-600">{threadError}</div>
                )}
                {!threadLoading && !threadError && thread.length === 0 && (
                  <div className="text-sm text-gray-500">{t("noMessagesInThread", { default: "No messages yet in this thread" })}</div>
                )}

                {thread.map((m) => {
                  type WithAttributes = { attributes?: Partial<Message> };
                  const mAttr = m as Message & WithAttributes;
                  const senderId = (typeof m.sender === "object" && m.sender && "id" in m.sender)
                    ? (m.sender as UserLite).id
                    : undefined;
                  const mine = senderId === user?.id;
                  const createdAt = mAttr.attributes?.createdAt || m.createdAt;
                  const rawBody = (m.body ?? mAttr.attributes?.body ?? "") as string;
                  const lines = rawBody.split(/\n+/).map((s) => s.trim()).filter(Boolean);
                  const urlRegex = /https?:\/\/[^\s]+/i;
                  // Prefer dedicated attachments field when present
                  type MaybeAttrAttachment = NonNullable<Message["attachments"]>[number] & {
                    attributes?: { url?: string; mime?: string; name?: string };
                  };
                  const att = (m.attachments ?? mAttr.attributes?.attachments ?? []) as MaybeAttrAttachment[];
                  const attachments = Array.isArray(att)
                    ? att.map((a) => ({
                        id: a?.id ?? 0,
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
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-[#cc922f] text-white" : "bg-gray-100 text-gray-800"}`}>
                        {caption && <div className="whitespace-pre-wrap">{caption}</div>}
                        {normalizedAtt.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {normalizedAtt.map((a) => (
                              <a key={`${a.id}-${a.url}`} href={a.url} target="_blank" rel="noreferrer">
                                {a.mime?.startsWith("image/") ? (
                                  <Image src={a.url} alt={a.name || "attachment"} className="rounded-md max-h-40 object-cover" />
                                ) : (
                                  <div className="px-2 py-1 bg-white/70 rounded text-xs break-all underline">
                                    {a.name || a.url}
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                        {normalizedAtt.length === 0 && legacyImageUrls.length > 0 && (
                          <div className={`mt-2 grid grid-cols-2 gap-2 ${mine ? "" : ""}`}>
                            {legacyImageUrls.map((u) => (
                              <a key={u} href={u} target="_blank" rel="noreferrer">
                                <Image src={u} alt="attachment" className="rounded-md max-h-40 object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                        {normalizedAtt.length === 0 && legacyFileUrls.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {legacyFileUrls.map((u) => (
                              <a key={u} href={u} target="_blank" rel="noreferrer" className={`${mine ? "text-orange-100" : "text-blue-600"} underline break-all`}>
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
                })}
              </div>

              <div className="border-t p-3 flex flex-col gap-3">
                {attachmentPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachmentPreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <Image src={src} className="h-16 w-16 object-cover rounded" alt="preview" />
                        <button
                          onClick={() => {
                            setAttachments((prev) => prev.filter((_, i) => i !== idx));
                            setAttachmentPreviews((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full h-6 w-6 text-xs"
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder={t("typeMessage", { default: "Type a message..." })}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                  <label className="p-1 rounded-md cursor-pointer bg-white hover:bg-gray-50">
                  <MdAttachFile size={20} />
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
                          // clear value to allow re-selecting same file
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>
                  <Button
                    onClick={onSend}
                    style="ghost"
                    disabled={(composerText.trim() === "" && attachments.length === 0) || sending || uploading}
                  >
                    <IoSendSharp size={20} />
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
