import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService, Conversation, Message, CreateSessionPayload } from "@/lib/messagingService";
import { getSocket } from "@/lib/socketClient";
import apiClient from "@/lib/apiClient";
import { format } from "date-fns";
import { Paperclip, Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addMessageId, dedupeList, mergeIntoConversationCache } from "@/lib/messageDedupe";

type ConversationListItem = Conversation & {
  displayName?: string;
};

type NormalizedMessage = Message & {
  senderName?: string;
  senderAvatar?: string;
};

type SessionFormState = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price?: string;
  link?: string;
};

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NormalizedMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState<SessionFormState>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    price: "",
    link: "",
  });
  const [creatingSession, setCreatingSession] = useState(false);

  const isTutor = user?.role === "tutor" || user?.profile?.role === "tutor";
  const hasSelectedOnce = useRef(false);

  const currentUserId = user?.id;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingThreads(true);
        const data = await messagingService.conversations.getAll();
        const mapped = data.map((c: any) => ({
          ...c,
          displayName: deriveDisplayName(c, currentUserId),
        }));
        setConversations(mapped);
        if (!hasSelectedOnce.current && mapped.length) {
          const queryConversation = searchParams.get("conversationId");
          const initial = queryConversation || mapped[0].id || (mapped[0] as any)._id;
          setSelectedId(initial);
          hasSelectedOnce.current = true;
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchConversations();
  }, [currentUserId, searchParams]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      setLoadingMessages(true);
      const result = await messagingService.messages.getByConversationId(selectedId, 50);
      const merged = mergeIntoConversationCache(
        selectedId,
        result.messages.reverse().map(normalizeMessage)
      ) as NormalizedMessage[];
      setMessages(dedupeList(merged) as NormalizedMessage[]);
      await messagingService.messages.markAsRead(selectedId);
      syncUnread(0);
      const nextParams = new URLSearchParams();
      nextParams.set("conversationId", selectedId);
      setSearchParams(nextParams, { replace: true });
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedId, setSearchParams]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket || !selectedId) return;

    const joinConversation = () => {
      socket.emit("conversation:join", { conversationId: selectedId });
    };

    const handleConnect = () => {
      joinConversation();
      // Backfill messages that may have arrived before socket was ready
      loadMessages();
    };

    joinConversation();
    socket.on("connect", handleConnect);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId !== selectedId) return;
      if (message.senderId === currentUserId) return; // ignore echo of sender's own message
      if (!addMessageId(message)) return;
      const merged = mergeIntoConversationCache(selectedId, [normalizeMessage(message)]) as NormalizedMessage[];
      setMessages(dedupeList(merged) as NormalizedMessage[]);
      syncUnread(unreadCount + 1);
      toast.success("New message");
    };
    const handleSent = (message: Message) => {
      if (message.conversationId !== selectedId) return;
      if (!addMessageId(message)) return;
      const merged = mergeIntoConversationCache(selectedId, [normalizeMessage(message)]) as NormalizedMessage[];
      setMessages(dedupeList(merged) as NormalizedMessage[]);
    };
    const handleTyping = ({ conversationId, userId }: any) => {
      if (conversationId !== selectedId || userId === currentUserId) return;
      setTypingUser(userId);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
    };
    const handleRead = ({ conversationId, messageIds }: any) => {
      if (conversationId !== selectedId || !messageIds) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes((m as any)._id || m.id)
            ? { ...m, status: "read" as any }
            : m
        )
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:sent", handleSent);
    socket.on("message:typing", handleTyping);
    socket.on("message:read", handleRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:sent", handleSent);
      socket.off("message:typing", handleTyping);
      socket.off("message:read", handleRead);
      socket.off("connect", handleConnect);
    };
  }, [selectedId, currentUserId, loadMessages]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId || (c as any)._id === selectedId),
    [conversations, selectedId]
  );

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const syncUnread = (count: number) => {
    setUnreadCount(count);
    localStorage.setItem("mm_unread_messages", String(count));
    window.dispatchEvent(new CustomEvent("message:unread", { detail: { count } }));
  };

  useEffect(() => {
    const stored = localStorage.getItem("mm_unread_messages");
    if (stored) {
      const num = parseInt(stored, 10);
      if (!isNaN(num)) setUnreadCount(num);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedId]);

  useEffect(() => {
    if (!loadingMessages) {
      // slight delay to allow render
      const t = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(t);
    }
  }, [loadingMessages]);

  const handleSend = async () => {
    if (!content.trim() || !selectedId || !currentUserId) return;
    try {
      setSending(true);
      const payload = {
        conversationId: selectedId,
        content: content.trim(),
        attachments,
      };
      const socket = socketRef.current;
      if (!socket) {
        toast.error("Socket not connected");
        return;
      }
      socket.emit("message:send", payload);
      // rely on socket 'message:new' for delivery/display to avoid duplicates
      setContent("");
      setAttachments([]);
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedId) return;
    if (!sessionForm.title || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error("Please fill title, date, start time, and end time.");
      return;
    }
    const payload: CreateSessionPayload = {
      title: sessionForm.title,
      date: sessionForm.date,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      price: sessionForm.price ? parseFloat(sessionForm.price) : undefined,
      link: sessionForm.link || undefined,
    };
    try {
      setCreatingSession(true);
      const message = await messagingService.messages.createSession(selectedId, payload);
      setMessages((prev) => dedupeList([...prev, normalizeMessage(message)]));
      setSessionDialogOpen(false);
      setSessionForm({ title: "", date: "", startTime: "", endTime: "", price: "", link: "" });
      toast.success("Session created");
    } catch (err: any) {
      console.error("Failed to create session", err);
      toast.error(err?.message || "Failed to create session");
    } finally {
      setCreatingSession(false);
    }
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !selectedId) return;
    socket.emit("message:typing", { conversationId: selectedId });
  };

  const handleFile = async (file: File) => {
    if (!currentUserId) return;
    const formData = new FormData();
    formData.append("document", file);
    formData.append("userId", currentUserId);
    formData.append("entityType", "user_profile");
    formData.append("isPublic", "false");
    try {
      setUploading(true);
      const result = await apiClient.post<any>("/api/files/documents/upload", formData);
      const url = result?.url || result?.data?.url;
      if (url) {
        setAttachments((prev) => [...prev, url]);
        toast.success("File uploaded");
      } else {
        toast.error("Upload failed: missing URL");
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const otherParticipantName = selectedConversation?.displayName || "Conversation";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Messages</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="border rounded-xl p-3 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-card-foreground">Conversations</span>
            </div>
            <div className="h-[420px] pr-2 overflow-y-auto">
              {loadingThreads ? (
                <div className="text-sm text-muted-foreground">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No conversations yet.</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => {
                    const id = c.id || (c as any)._id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedId(id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedId === id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="text-sm font-semibold text-card-foreground truncate">
                          {c.displayName || "Conversation"}
                        </div>
                        {c.lastMessage?.content && (
                          <div className="text-xs text-muted-foreground truncate">
                            {c.lastMessage.content}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-card flex flex-col h-[520px] min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-semibold text-card-foreground">
                  {otherParticipantName}
                </div>
                {typingUser && (
                  <div className="text-xs text-primary">Typing...</div>
                )}
              </div>
              {isTutor && (
                <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Create 1:1 Session</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create One-on-One Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="Title"
                        value={sessionForm.title}
                        onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm((p) => ({ ...p, date: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="time"
                          value={sessionForm.startTime}
                          onChange={(e) => setSessionForm((p) => ({ ...p, startTime: e.target.value }))}
                        />
                        <Input
                          type="time"
                          value={sessionForm.endTime}
                          onChange={(e) => setSessionForm((p) => ({ ...p, endTime: e.target.value }))}
                        />
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price (optional)"
                        value={sessionForm.price}
                        onChange={(e) => setSessionForm((p) => ({ ...p, price: e.target.value }))}
                      />
                      <Input
                        type="url"
                        placeholder="Join/Details link (optional)"
                        value={sessionForm.link}
                        onChange={(e) => setSessionForm((p) => ({ ...p, link: e.target.value }))}
                      />
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateSession} disabled={creatingSession}>
                        {creatingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex-1 border rounded-lg bg-muted/30 min-h-0">
              <div className="h-full p-3 overflow-y-auto" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                ) : (
                  <div className="space-y-3">
                    {dedupeList(messages).map((m) => {
                      const mine = m.senderId === currentUserId;
                      const isSession = m.metadata?.type === "session_invite";
                      if (isSession) {
                        const session = (m.metadata as any)?.session || {};
                        return (
                          <div key={m.id || (m as any)._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                            <div className="max-w-[90%] rounded-lg border border-border bg-card shadow-sm p-3 text-sm space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-card-foreground">{session.title || "1:1 Session"}</div>
                                <span className="text-xs text-muted-foreground">
                                  {session.date} {session.startTime && `• ${session.startTime}`} {session.endTime && `- ${session.endTime}`}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {session.price ? `Price: $${session.price}` : "No price set"}
                              </div>
                              {session.link && (
                                <div>
                                  <a
                                    href={session.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline text-sm"
                                  >
                                    View / Join
                                  </a>
                                </div>
                              )}
                              <div className="text-[11px] text-muted-foreground">
                                {format(new Date(m.createdAt), "MMM d, h:mm a")}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id || (m as any)._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                              mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"
                            )}
                          >
                            <div className="whitespace-pre-wrap">{m.content}</div>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {m.attachments.map((url: string) => (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                      "text-xs underline",
                                      mine ? "text-primary-foreground" : "text-primary"
                                    )}
                                  >
                                    Attachment
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className={cn("text-[11px] mt-1", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                              {format(new Date(m.createdAt), "MMM d, h:mm a")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {attachments.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded bg-muted">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-primary"
                      >
                        Attachment {idx + 1}
                      </a>
                      <button
                        className="text-muted-foreground hover:text-foreground text-xs"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={handleTyping}
                onKeyDown={handleTyping}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                    {uploading ? "Uploading..." : "Attach"}
                  </label>
                </div>
                <Button onClick={handleSend} disabled={sending || !content.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-2">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function deriveDisplayName(conversation: any, currentUserId?: string | null) {
  const participants = conversation.participants || [];
  const others = participants.filter((p: any) => (p?._id || p?.id || p)?.toString() !== currentUserId);
  if (others.length === 0 && participants.length > 0) {
    return "Conversation";
  }
  const first = others[0];
  if (typeof first === "string") return "Conversation";
  return first.fullName || first.full_name || [first.firstName, first.lastName].filter(Boolean).join(" ") || "Conversation";
}

function normalizeMessage(m: any): NormalizedMessage {
  const senderObj = m.sender || m.senderId;
  const senderId = typeof senderObj === "object" ? senderObj.id || senderObj._id : senderObj;
  const senderName =
    typeof senderObj === "object"
      ? senderObj.fullName ||
        senderObj.full_name ||
        [senderObj.firstName, senderObj.lastName].filter(Boolean).join(" ")
      : undefined;
  const senderAvatar = typeof senderObj === "object" ? senderObj.avatarUrl || senderObj.avatar_url : undefined;

  return {
    ...m,
    id: m.id || m._id,
    senderId,
    senderName,
    senderAvatar,
    conversationId: m.conversationId || m.conversation_id,
    attachments: m.attachments || [],
  };
}

export default MessagesPage;



